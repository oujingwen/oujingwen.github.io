/**
 * Procedural low-poly tree for three.js.
 *
 * A single ES module with one dependency: `three`. It builds the tree geometry and
 * returns a THREE.Group; it does not create a renderer, scene, camera or any DOM.
 *
 * Usage:
 *   import * as THREE from 'three';
 *   import { createTree } from './tree.js';
 *
 *   const tree = createTree({ seed: 42, season: 'autumn' });
 *   scene.add(tree);
 *
 *   // later
 *   scene.remove(tree);
 *   tree.userData.dispose();
 *
 * The group contains:
 *   - "Bark":   a Mesh with all branches merged into one BufferGeometry
 *   - "Leaves": an InstancedMesh (default) or a single Mesh with vertex colors
 *               when `instancedLeaves: false` (better for exporting to glTF/OBJ).
 *               Omitted when there are no leaves (e.g. winter).
 *
 * The trunk base sits at the origin, the tree grows along +Y and its total height
 * is normalized to `options.height`.
 */
import * as THREE from 'three';

export const SEASONS = {
    spring: { leaves: ['#f9a8d4', '#fbcfe8', '#f472b6', '#fdf2f8', '#bef264'], bark: '#6b4f3a', density: 1, leafScale: 0.85 },
    summer: { leaves: ['#3f6212', '#4d7c0f', '#65a30d', '#84cc16', '#166534'], bark: '#5b4330', density: 1, leafScale: 1 },
    autumn: { leaves: ['#ea580c', '#f59e0b', '#dc2626', '#c2410c', '#facc15'], bark: '#5b4330', density: 0.85, leafScale: 1 },
    winter: { leaves: [], bark: '#7a6656', density: 0, leafScale: 1 }
};

export const DEFAULT_TREE_OPTIONS = {
    seed: undefined,        // integer; random when undefined (the value used is in userData.seed)
    depth: 7,               // recursion levels below the trunk
    branches: 3,            // children per branch node (2-6)
    angle: 32,              // spread angle of side branches, in degrees
    leavesPerTip: 10,       // leaves around each terminal branch
    season: 'summer',       // 'spring' | 'summer' | 'autumn' | 'winter'
    height: 7,              // total tree height in world units
    trunkRadius: 0.3,       // trunk radius before height normalization
    maxSegments: 4000,      // branch budget; depth is reduced if it would be exceeded
    instancedLeaves: true,  // false -> leaves baked into one Mesh with vertex colors
    castShadow: true,
    receiveShadow: true
};

const UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/** Merge indexed geometries that all have position, normal and uv attributes. */
function mergeIndexed(geometries) {
    let vertexCount = 0;
    let indexCount = 0;
    for (const g of geometries) {
        vertexCount += g.attributes.position.count;
        indexCount += g.index.count;
    }
    const position = new Float32Array(vertexCount * 3);
    const normal = new Float32Array(vertexCount * 3);
    const uv = new Float32Array(vertexCount * 2);
    const index = new Uint32Array(indexCount);

    let vOffset = 0;
    let iOffset = 0;
    for (const g of geometries) {
        const n = g.attributes.position.count;
        position.set(g.attributes.position.array, vOffset * 3);
        normal.set(g.attributes.normal.array, vOffset * 3);
        uv.set(g.attributes.uv.array, vOffset * 2);
        const src = g.index.array;
        for (let i = 0; i < src.length; i++) index[iOffset + i] = src[i] + vOffset;
        vOffset += n;
        iOffset += src.length;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.setIndex(new THREE.BufferAttribute(index, 1));
    return merged;
}

function createLeafGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.55, 0.45, 0, 1.2);
    shape.quadraticCurveTo(-0.55, 0.45, 0, 0);
    return new THREE.ShapeGeometry(shape, 3);
}

/** Bake per-instance transforms and colors into one geometry with a color attribute. */
function bakeInstances(baseGeometry, matrices, colors) {
    const pos = baseGeometry.attributes.position;
    const nor = baseGeometry.attributes.normal;
    const idx = baseGeometry.index;
    const n = matrices.length;
    const vc = pos.count;
    const ic = idx.count;
    const P = new Float32Array(n * vc * 3);
    const N = new Float32Array(n * vc * 3);
    const C = new Float32Array(n * vc * 3);
    const I = new Uint32Array(n * ic);
    const nm = new THREE.Matrix3();
    const v = new THREE.Vector3();

    for (let i = 0; i < n; i++) {
        const m = matrices[i];
        const c = colors[i];
        nm.getNormalMatrix(m);
        for (let j = 0; j < vc; j++) {
            const o = (i * vc + j) * 3;
            v.fromBufferAttribute(pos, j).applyMatrix4(m);
            P[o] = v.x; P[o + 1] = v.y; P[o + 2] = v.z;
            v.fromBufferAttribute(nor, j).applyMatrix3(nm).normalize();
            N[o] = v.x; N[o + 1] = v.y; N[o + 2] = v.z;
            C[o] = c.r; C[o + 1] = c.g; C[o + 2] = c.b;
        }
        for (let k = 0; k < ic; k++) I[i * ic + k] = idx.getX(k) + i * vc;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    g.setIndex(new THREE.BufferAttribute(I, 1));
    return g;
}

/**
 * Build a procedural tree.
 * @param {Partial<typeof DEFAULT_TREE_OPTIONS>} options
 * @returns {THREE.Group} group with userData { seed, depth, branchCount, leafCount, options, dispose }
 */
export function createTree(options = {}) {
    const o = { ...DEFAULT_TREE_OPTIONS, ...options };
    const palette = SEASONS[o.season];
    if (!palette) {
        throw new Error('Unknown season "' + o.season + '". Use one of: ' + Object.keys(SEASONS).join(', '));
    }

    const branches = THREE.MathUtils.clamp(Math.round(o.branches), 2, 6);
    const maxDepth = Math.floor(Math.log(o.maxSegments) / Math.log(branches));
    const depth = THREE.MathUtils.clamp(Math.round(o.depth), 1, maxDepth);
    const seed = Number.isInteger(o.seed) ? o.seed : Math.floor(Math.random() * 1e9);
    const rand = mulberry32(seed);
    const spread = THREE.MathUtils.degToRad(o.angle);

    // ---- Branch skeleton ----
    const segments = [];   // { start, dir, len, r0, r1 }
    const tips = [];       // { pos, dir, len }

    function grow(start, dir, len, radius, level) {
        const end = start.clone().addScaledVector(dir, len);
        const childRadius = radius * 0.68;
        segments.push({ start, dir, len, r0: radius, r1: level === 0 ? radius * 0.45 : childRadius });

        if (level === 0) {
            tips.push({ pos: end, dir, len });
            return;
        }

        const azimuth0 = rand() * Math.PI * 2;
        const ref = Math.abs(dir.y) < 0.95 ? UP : X_AXIS;
        const perp = new THREE.Vector3().crossVectors(dir, ref).normalize();

        for (let i = 0; i < branches; i++) {
            // The first child continues the leader with a small bend; the others spread out.
            const isLeader = i === 0;
            const bend = isLeader
                ? spread * (0.15 + rand() * 0.25)
                : spread * (0.75 + rand() * 0.5);
            const azimuth = azimuth0 + (i / branches) * Math.PI * 2 + (rand() - 0.5) * 0.8;
            const axis = perp.clone().applyAxisAngle(dir, azimuth);
            const newDir = dir.clone().applyAxisAngle(axis, bend);
            newDir.y += 0.12 + (1 - level / depth) * 0.08;   // upward tropism
            newDir.normalize();

            const lenScale = (isLeader ? 0.78 : 0.68) + (rand() - 0.5) * 0.14;
            const startAt = isLeader ? end : start.clone().lerp(end, 0.82 + rand() * 0.18);
            grow(startAt, newDir, len * lenScale, isLeader ? childRadius : childRadius * 0.9, level - 1);
        }
    }

    const trunkDir = new THREE.Vector3((rand() - 0.5) * 0.12, 1, (rand() - 0.5) * 0.12).normalize();
    grow(new THREE.Vector3(0, 0, 0), trunkDir, 2.0 + rand() * 0.4, o.trunkRadius, depth);

    // ---- Height normalization ----
    let rawHeight = 0;
    for (const s of segments) rawHeight = Math.max(rawHeight, s.start.y + s.dir.y * s.len);
    for (const t of tips) rawHeight = Math.max(rawHeight, t.pos.y + t.len * 0.5);
    const scale = o.height / rawHeight;

    // ---- Bark geometry ----
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const parts = [];
    for (const s of segments) {
        const radial = s.r0 > 0.12 ? 8 : s.r0 > 0.04 ? 6 : 4;
        // Extend each segment slightly backwards so joints overlap without gaps.
        const overlap = Math.min(s.r0 * 1.2, s.len * 0.3);
        const g = new THREE.CylinderGeometry(s.r1, s.r0, s.len + overlap, radial, 1, true);
        g.translate(0, (s.len + overlap) / 2 - overlap, 0);
        q.setFromUnitVectors(UP, s.dir);
        m.compose(s.start, q, one);
        g.applyMatrix4(m);
        parts.push(g);
    }
    const flare = new THREE.CylinderGeometry(o.trunkRadius, o.trunkRadius * 1.6, 0.35, 8, 1, true);
    flare.translate(0, 0.175, 0);
    parts.push(flare);

    const barkGeometry = mergeIndexed(parts);
    parts.forEach((g) => g.dispose());
    barkGeometry.scale(scale, scale, scale);
    barkGeometry.computeBoundingBox();
    barkGeometry.computeBoundingSphere();

    const barkMaterial = new THREE.MeshStandardMaterial({
        color: palette.bark,
        roughness: 0.95,
        flatShading: true
    });
    const bark = new THREE.Mesh(barkGeometry, barkMaterial);
    bark.name = 'Bark';
    bark.castShadow = o.castShadow;
    bark.receiveShadow = o.receiveShadow;

    const group = new THREE.Group();
    group.name = 'Tree';
    group.add(bark);

    // ---- Leaves ----
    const perTip = Math.max(0, Math.round(o.leavesPerTip * palette.density));
    const leafCount = palette.leaves.length ? tips.length * perTip : 0;
    let leafGeometry = null;
    let leafMaterial = null;

    if (leafCount > 0) {
        const swatches = palette.leaves.map((c) => new THREE.Color(c));
        const matrices = new Array(leafCount);
        const colors = new Array(leafCount);
        const pos = new THREE.Vector3();
        const scl = new THREE.Vector3();
        const euler = new THREE.Euler();
        let idx = 0;

        for (const t of tips) {
            const radius = Math.max(t.len * 0.9, 0.18);
            for (let i = 0; i < perTip; i++) {
                // Random point in a sphere around the tip, pulled back along the branch.
                const u = rand() * 2 - 1;
                const th = rand() * Math.PI * 2;
                const r = radius * Math.cbrt(rand());
                const sq = Math.sqrt(1 - u * u);
                pos.set(sq * Math.cos(th), u, sq * Math.sin(th)).multiplyScalar(r);
                pos.addScaledVector(t.dir, -t.len * 0.3 * rand());
                pos.add(t.pos).multiplyScalar(scale);

                euler.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
                q.setFromEuler(euler);
                const s = (0.16 + rand() * 0.12) * palette.leafScale;
                scl.set(s, s, s);
                matrices[idx] = new THREE.Matrix4().compose(pos, q, scl);

                const c = swatches[Math.floor(rand() * swatches.length)].clone();
                c.offsetHSL(0, 0, (rand() - 0.5) * 0.08);
                colors[idx] = c;
                idx++;
            }
        }

        const baseLeaf = createLeafGeometry();
        let leaves;
        if (o.instancedLeaves) {
            leafGeometry = baseLeaf;
            leafMaterial = new THREE.MeshStandardMaterial({ roughness: 0.75, side: THREE.DoubleSide, flatShading: true });
            leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, leafCount);
            for (let i = 0; i < leafCount; i++) {
                leaves.setMatrixAt(i, matrices[i]);
                leaves.setColorAt(i, colors[i]);
            }
            leaves.instanceMatrix.needsUpdate = true;
            leaves.instanceColor.needsUpdate = true;
            leaves.computeBoundingBox();
            leaves.computeBoundingSphere();
        } else {
            leafGeometry = bakeInstances(baseLeaf, matrices, colors);
            baseLeaf.dispose();
            leafGeometry.computeBoundingBox();
            leafGeometry.computeBoundingSphere();
            leafMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide, flatShading: true });
            leaves = new THREE.Mesh(leafGeometry, leafMaterial);
        }
        leaves.name = 'Leaves';
        leaves.castShadow = o.castShadow;
        leaves.receiveShadow = o.receiveShadow;
        group.add(leaves);
    }

    group.userData = {
        seed,
        depth,
        branchCount: segments.length,
        leafCount,
        options: { ...o, seed, depth, branches },
        dispose() {
            barkGeometry.dispose();
            barkMaterial.dispose();
            if (leafGeometry) leafGeometry.dispose();
            if (leafMaterial) leafMaterial.dispose();
            const leaves = group.getObjectByName('Leaves');
            if (leaves && leaves.isInstancedMesh) leaves.dispose();
        }
    };

    return group;
}

export default createTree;
