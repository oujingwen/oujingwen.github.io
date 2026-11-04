/**
 * Procedural low-poly tree for three.js.
 *
 * A plain script (no import/export) that uses the global `THREE`. It works in:
 *   - three-live (google/three-live): paste the whole file; the tree is added to the
 *     provided `scene` automatically
 *   - Three.js viewers / sandboxes that provide `THREE`, `canvas`, `width`, `height`
 *     (paste the whole file: the demo at the bottom renders a tree)
 *   - a browser <script> after three.js is loaded: `TreeGenerator.createTree(...)`
 *   - Node / CommonJS: `const { createTree } = require('./tree.js')` (uses require('three'))
 *
 * Usage:
 *   const tree = TreeGenerator.createTree({ seed: 42, season: 'autumn' });
 *   scene.add(tree);
 *
 *   // later
 *   scene.remove(tree);
 *   tree.userData.dispose();
 *
 * Compatibility notes:
 *   All geometry is computed by this file and stored in plain BufferGeometry objects.
 *   It only uses BufferGeometry, BufferAttribute, Mesh, Group and MeshStandardMaterial,
 *   so it also runs on reduced three.js implementations such as the three-live
 *   authoring runtime, which lacks most Vector3 / geometry helper methods and does
 *   not export vertex colors. Leaves are therefore split into one mesh per color.
 *
 * The returned THREE.Group ("Tree") contains:
 *   - "Bark":   one Mesh with all branches
 *   - "Leaves": a Group with one Mesh per leaf color ("Leaves_0", "Leaves_1", ...),
 *               omitted when there are no leaves (e.g. winter)
 *
 * The trunk base sits at the origin, the tree grows along +Y and its total height
 * is normalized to `options.height`.
 */
var TreeGenerator = (function (THREE) {
    'use strict';

    if (!THREE) {
        throw new Error('tree.js needs three.js: load it first so that THREE is defined.');
    }

    const DOUBLE_SIDE = 2; // THREE.DoubleSide; a literal so reduced runtimes don't need the constant

    const SEASONS = {
        spring: { leaves: [0xf9a8d4, 0xfbcfe8, 0xf472b6, 0xfdf2f8, 0xbef264], bark: 0x6b4f3a, density: 1, leafScale: 0.85 },
        summer: { leaves: [0x3f6212, 0x4d7c0f, 0x65a30d, 0x84cc16, 0x166534], bark: 0x5b4330, density: 1, leafScale: 1 },
        autumn: { leaves: [0xea580c, 0xf59e0b, 0xdc2626, 0xc2410c, 0xfacc15], bark: 0x5b4330, density: 0.85, leafScale: 1 },
        winter: { leaves: [], bark: 0x7a6656, density: 0, leafScale: 1 }
    };

    const DEFAULT_TREE_OPTIONS = {
        seed: undefined,        // integer; random when undefined (the value used is in userData.seed)
        depth: 6,               // recursion levels below the trunk
        branches: 3,            // children per branch node (2-6)
        angle: 32,              // spread angle of side branches, in degrees
        leavesPerTip: 8,        // leaves around each terminal branch
        season: 'summer',       // 'spring' | 'summer' | 'autumn' | 'winter'
        height: 7,              // total tree height in world units
        trunkRadius: 0.3,       // trunk radius before height normalization
        maxSegments: 2000,      // branch budget; depth is reduced if it would be exceeded
        maxLeaves: 8000,        // leaf budget; leavesPerTip is reduced if it would be exceeded
        castShadow: true,
        receiveShadow: true
    };

    // ---- Small vector helpers on [x, y, z] arrays (no dependency on Vector3 methods) ----
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
    function madd(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function cross(a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function norm(a) {
        const l = Math.sqrt(dot(a, a)) || 1;
        return [a[0] / l, a[1] / l, a[2] / l];
    }
    /** Rotate v around the unit axis k by angle (Rodrigues' formula). */
    function rotate(v, k, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const kv = cross(k, v);
        const kd = dot(k, v) * (1 - c);
        return [
            v[0] * c + kv[0] * s + k[0] * kd,
            v[1] * c + kv[1] * s + k[1] * kd,
            v[2] * c + kv[2] * s + k[2] * kd
        ];
    }
    /** Unit vector perpendicular to the unit vector d. */
    function perpendicular(d) {
        return norm(cross(d, Math.abs(d[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0]));
    }

    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function makeGeometry(positions, normals, indices, vertexCount) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
        geometry.setIndex(new THREE.BufferAttribute(indices instanceof IndexArray ? indices : new IndexArray(indices), 1));
        return geometry;
    }

    /**
     * Build a procedural tree.
     * @param {Partial<typeof DEFAULT_TREE_OPTIONS>} options
     * @returns {THREE.Group} group with userData { seed, depth, branchCount, leafCount, options, dispose }
     */
    function createTree(options) {
        const o = Object.assign({}, DEFAULT_TREE_OPTIONS, options || {});
        const palette = SEASONS[o.season];
        if (!palette) {
            throw new Error('Unknown season "' + o.season + '". Use one of: ' + Object.keys(SEASONS).join(', '));
        }

        const branches = Math.min(6, Math.max(2, Math.round(o.branches)));
        const maxDepth = Math.max(1, Math.floor(Math.log(o.maxSegments) / Math.log(branches)));
        const depth = Math.min(maxDepth, Math.max(1, Math.round(o.depth)));
        const seed = Number.isInteger(o.seed) ? o.seed : Math.floor(Math.random() * 1e9);
        const rand = mulberry32(seed);
        const spread = o.angle * Math.PI / 180;

        // ---- Branch skeleton ----
        const segments = [];   // { start, dir, len, r0, r1 }
        const tips = [];       // { pos, dir, len }

        function grow(start, dir, len, radius, level) {
            const end = madd(start, dir, len);
            const childRadius = radius * 0.68;
            segments.push({ start: start, dir: dir, len: len, r0: radius, r1: level === 0 ? radius * 0.45 : childRadius });

            if (level === 0) {
                tips.push({ pos: end, dir: dir, len: len });
                return;
            }

            const azimuth0 = rand() * Math.PI * 2;
            const perp = perpendicular(dir);

            for (let i = 0; i < branches; i++) {
                // The first child continues the leader with a small bend; the others spread out.
                const isLeader = i === 0;
                const bend = isLeader
                    ? spread * (0.15 + rand() * 0.25)
                    : spread * (0.75 + rand() * 0.5);
                const azimuth = azimuth0 + (i / branches) * Math.PI * 2 + (rand() - 0.5) * 0.8;
                const axis = rotate(perp, dir, azimuth);
                let newDir = rotate(dir, axis, bend);
                newDir[1] += 0.12 + (1 - level / depth) * 0.08;   // upward tropism
                newDir = norm(newDir);

                const lenScale = (isLeader ? 0.78 : 0.68) + (rand() - 0.5) * 0.14;
                const startAt = isLeader ? end : madd(start, dir, len * (0.82 + rand() * 0.18));
                grow(startAt, newDir, len * lenScale, isLeader ? childRadius : childRadius * 0.9, level - 1);
            }
        }

        const trunkDir = norm([(rand() - 0.5) * 0.12, 1, (rand() - 0.5) * 0.12]);
        grow([0, 0, 0], trunkDir, 2.0 + rand() * 0.4, o.trunkRadius, depth);

        // ---- Height normalization ----
        let rawHeight = 0;
        for (const s of segments) rawHeight = Math.max(rawHeight, s.start[1] + s.dir[1] * s.len);
        for (const t of tips) rawHeight = Math.max(rawHeight, t.pos[1] + t.len * 0.5);
        const scale = o.height / rawHeight;

        // ---- Bark: one tapered, open-ended cylinder per segment ----
        const flare = { start: [0, 0, 0], dir: [0, 1, 0], len: 0.35, r0: o.trunkRadius * 1.6, r1: o.trunkRadius, flare: true };
        const tubes = segments.concat([flare]);
        let barkVerts = 0;
        let barkIdx = 0;
        for (const s of tubes) {
            s.radial = s.flare ? 8 : s.r0 > 0.12 ? 7 : s.r0 > 0.04 ? 5 : 3;
            barkVerts += s.radial * 2;
            barkIdx += s.radial * 6;
        }
        const bp = new Float32Array(barkVerts * 3);
        const bn = new Float32Array(barkVerts * 3);
        const bi = new (barkVerts > 65535 ? Uint32Array : Uint16Array)(barkIdx);
        let vOff = 0;
        let iOff = 0;

        for (const s of tubes) {
            const d = s.dir;
            const u = perpendicular(d);
            const w = cross(d, u);
            // Extend each segment slightly backwards so joints overlap without gaps.
            const overlap = s.flare ? 0 : Math.min(s.r0 * 1.2, s.len * 0.3);
            const base = madd(s.start, d, -overlap);
            const top = madd(s.start, d, s.len);
            const slope = (s.r0 - s.r1) / (s.len + overlap);
            const n = s.radial;

            for (let k = 0; k < n; k++) {
                const a = (k / n) * Math.PI * 2;
                const ring = add(mul(u, Math.cos(a)), mul(w, Math.sin(a)));
                const normal = norm(madd(ring, d, slope));
                const pb = madd(base, ring, s.r0);
                const pt = madd(top, ring, s.r1);
                const ob = (vOff + k) * 3;
                const ot = (vOff + n + k) * 3;
                bp[ob] = pb[0] * scale; bp[ob + 1] = pb[1] * scale; bp[ob + 2] = pb[2] * scale;
                bp[ot] = pt[0] * scale; bp[ot + 1] = pt[1] * scale; bp[ot + 2] = pt[2] * scale;
                bn[ob] = bn[ot] = normal[0];
                bn[ob + 1] = bn[ot + 1] = normal[1];
                bn[ob + 2] = bn[ot + 2] = normal[2];

                // Quad (bottom k, bottom k+1, top k+1, top k), counter-clockwise from outside
                const b0 = vOff + k;
                const b1 = vOff + (k + 1) % n;
                const t0 = vOff + n + k;
                const t1 = vOff + n + (k + 1) % n;
                bi[iOff++] = b0; bi[iOff++] = b1; bi[iOff++] = t1;
                bi[iOff++] = b0; bi[iOff++] = t1; bi[iOff++] = t0;
            }
            vOff += n * 2;
        }

        const barkGeometry = makeGeometry(bp, bn, bi, barkVerts);
        const barkMaterial = new THREE.MeshStandardMaterial({
            color: palette.bark,
            roughness: 0.95,
            metalness: 0,
            flatShading: true
        });
        const bark = new THREE.Mesh(barkGeometry, barkMaterial);
        bark.name = 'Bark';
        bark.castShadow = o.castShadow;
        bark.receiveShadow = o.receiveShadow;

        const group = new THREE.Group();
        group.name = 'Tree';
        group.add(bark);

        // ---- Leaves: flat diamonds, one mesh per palette color ----
        let perTip = Math.max(0, Math.round(o.leavesPerTip * palette.density));
        if (tips.length * perTip > o.maxLeaves) perTip = Math.floor(o.maxLeaves / tips.length);
        const leafCount = palette.leaves.length ? tips.length * perTip : 0;
        const geometries = [barkGeometry];
        const materials = [barkMaterial];

        if (leafCount > 0) {
            const colorCount = palette.leaves.length;
            const buckets = [];
            for (let c = 0; c < colorCount; c++) buckets.push({ p: [], n: [], count: 0 });
            const sizeUnit = o.height / 7;

            for (const t of tips) {
                const radius = Math.max(t.len * 0.9, 0.18);
                for (let i = 0; i < perTip; i++) {
                    // Random point in a sphere around the tip, pulled back along the branch.
                    const uu = rand() * 2 - 1;
                    const th = rand() * Math.PI * 2;
                    const r = radius * Math.cbrt(rand());
                    const sq = Math.sqrt(1 - uu * uu);
                    let c = madd(t.pos, [sq * Math.cos(th), uu, sq * Math.sin(th)], r);
                    c = mul(madd(c, t.dir, -t.len * 0.3 * rand()), scale);

                    // Random orientation: normal n, leaf axis ax, side axis sd
                    const n = norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]);
                    const ax = perpendicular(n);
                    const rotAx = rotate(ax, n, rand() * Math.PI * 2);
                    const sd = cross(n, rotAx);
                    const size = (0.2 + rand() * 0.14) * palette.leafScale * sizeUnit;
                    const L = size * 1.2;
                    const W = size * 0.42;

                    const stem = c;
                    const tip = madd(c, rotAx, L);
                    const mid = madd(c, rotAx, L * 0.45);
                    const left = madd(mid, sd, W);
                    const right = madd(mid, sd, -W);

                    const bucket = buckets[Math.floor(rand() * colorCount)];
                    bucket.p.push(
                        stem[0], stem[1], stem[2],
                        left[0], left[1], left[2],
                        tip[0], tip[1], tip[2],
                        right[0], right[1], right[2]
                    );
                    for (let k = 0; k < 4; k++) bucket.n.push(n[0], n[1], n[2]);
                    bucket.count++;
                }
            }

            const leavesGroup = new THREE.Group();
            leavesGroup.name = 'Leaves';
            for (let ci = 0; ci < colorCount; ci++) {
                const b = buckets[ci];
                if (b.count === 0) continue;
                const verts = b.count * 4;
                const idx = new (verts > 65535 ? Uint32Array : Uint16Array)(b.count * 6);
                for (let l = 0; l < b.count; l++) {
                    const v0 = l * 4;
                    const o6 = l * 6;
                    idx[o6] = v0; idx[o6 + 1] = v0 + 1; idx[o6 + 2] = v0 + 2;
                    idx[o6 + 3] = v0; idx[o6 + 4] = v0 + 2; idx[o6 + 5] = v0 + 3;
                }
                const geometry = makeGeometry(new Float32Array(b.p), new Float32Array(b.n), idx, verts);
                const material = new THREE.MeshStandardMaterial({
                    color: palette.leaves[ci],
                    roughness: 0.75,
                    metalness: 0,
                    side: DOUBLE_SIDE,
                    flatShading: true
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.name = 'Leaves_' + ci;
                mesh.castShadow = o.castShadow;
                mesh.receiveShadow = o.receiveShadow;
                leavesGroup.add(mesh);
                geometries.push(geometry);
                materials.push(material);
            }
            group.add(leavesGroup);
        }

        group.userData = {
            seed: seed,
            depth: depth,
            branchCount: segments.length,
            leafCount: leafCount,
            options: Object.assign({}, o, { seed: seed, depth: depth, branches: branches, leavesPerTip: perTip }),
            dispose: function () {
                for (const g of geometries) if (typeof g.dispose === 'function') g.dispose();
                for (const m of materials) if (typeof m.dispose === 'function') m.dispose();
            }
        };

        return group;
    }

    return { createTree: createTree, SEASONS: SEASONS, DEFAULT_TREE_OPTIONS: DEFAULT_TREE_OPTIONS };
})(
    typeof THREE !== 'undefined' ? THREE
        : typeof require === 'function' ? require('three')
        : undefined
);

if (typeof module === 'object' && module.exports) {
    module.exports = TreeGenerator;
}
if (typeof window !== 'undefined') {
    window.TreeGenerator = TreeGenerator;
}

// ---------------------------------------------------------------------------
// three-live (google/three-live): `scene` is provided and has toGLB().
// Add the tree and two lights to it; three-live handles camera and rendering.
// ---------------------------------------------------------------------------
if (typeof canvas === 'undefined' && typeof scene !== 'undefined' && scene &&
    typeof scene.add === 'function' && typeof scene.toGLB === 'function') {
    (function () {
        // Kept small: three-live runs scripts in an interpreter with a short time budget.
        const tree = TreeGenerator.createTree({ seed: 42, season: 'summer', height: 3, depth: 5, leavesPerTip: 8 });
        scene.add(tree);

        const sun = new THREE.DirectionalLight(0xfff1dc, 2.0);
        sun.position.set(3, 6, 4);
        scene.add(sun);
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    })();
}

// ---------------------------------------------------------------------------
// Demo: runs only in viewers that provide a `canvas` global (with width/height).
// ---------------------------------------------------------------------------
if (typeof canvas !== 'undefined' && typeof THREE !== 'undefined') {
    (function () {
        const w = typeof width !== 'undefined' ? width : canvas.clientWidth || 800;
        const h = typeof height !== 'undefined' ? height : canvas.clientHeight || 450;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene3d = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
        camera.position.set(10, 6, 12).setLength(Math.max(17, 17 * 1.2 / (w / h)));

        scene3d.add(new THREE.HemisphereLight(0xfff7ed, 0xd6cfc4, 1.6));
        const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
        sun.position.set(7, 14, 6);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 12, bottom: -6, near: 1, far: 40 });
        sun.shadow.normalBias = 0.02;
        scene3d.add(sun);

        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: 0xe2e6c8, roughness: 1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene3d.add(ground);

        const tree = TreeGenerator.createTree({ seed: 42, season: 'summer' });
        scene3d.add(tree);

        const target = new THREE.Vector3(0, 3.6, 0);
        let controls = null;
        if (typeof OrbitControls !== 'undefined') {
            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.copy(target);
            controls.enableDamping = true;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.8;
            controls.maxPolarAngle = Math.PI / 2 - 0.04;
        }
        camera.lookAt(target);

        function animate() {
            requestAnimationFrame(animate);
            if (controls) controls.update();
            else tree.rotation.y += 0.004;
            renderer.render(scene3d, camera);
        }
        animate();
    })();
}
