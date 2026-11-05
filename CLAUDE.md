# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal GitHub Pages portfolio site for Jingwen Ou (oujingwen.github.io) built with Jekyll. All pages share one visual style, typeset like a short technical paper. The repository contains:
- A single-page portfolio (`index.html`)
- An 8-dimensional hypercube (octeract) projection visualization (`8d-hypercube.html`)
- A standalone Super Mario-style browser game (`gemini3-demo.html`, also served at `/gemini3-demo/`)
- Legacy React files (`app.js`, `index.js`, `package-lock.json`) from a previous iteration

## Deployment

- **Platform**: GitHub Pages, built from the `gh-pages` branch (the default and deployment branch)
- **Remote**: https://github.com/oujingwen/oujingwen.github.io.git
- **Live URL**: https://oujingwen.github.io
- **Workflow**: changes are made on a feature branch and merged into `gh-pages` through a pull request. Every merge redeploys the site, usually within a few minutes

## Architecture

### Jekyll Configuration (`_config.yml`)
- `theme: jekyll-theme-minimal` is set but not used: `index.html` sets `layout: null`, and the other pages have no front matter
- `title: Jingwen Ou` and `description: Welcome to my personal page! I'm a developer passionate about creating innovative solutions.`, both used in the `<head>` of `index.html`
- `exclude: [CLAUDE.md]` keeps this file out of the published site. Setting `exclude` replaces Jekyll's default exclude list; nothing else in the repository currently needs excluding

### Shared Visual Style
There are no shared stylesheets or scripts: each page carries its own copy of the style. When changing anything below, update every page (`index.html`, `8d-hypercube.html`, `gemini3-demo.html` and its copy `gemini3-demo/index.html`).
- Color tokens on `:root`: `--paper: #f4f0e6`, `--paper-2: #ebe5d7`, `--ink: #1c1a15`, `--ink-2: #5c5648`, `--rule: rgba(28, 26, 21, 0.2)`, `--accent: #2b45b5` (ink blue); `index.html` and `8d-hypercube.html` also define `--grid-line` for figure plates. Light only; there is no dark theme
- Fonts (Google Fonts): Newsreader for text and headings, IBM Plex Mono for labels, captions and navigation; Noto Serif TC / Noto Sans TC as fallbacks for Chinese text
- Running head: "JO" logo on the left, navigation or a "← 回到作品集" link on the right, a hairline rule below. Sticky on the homepage and the 8D page, fixed on the game page
- Hairline rules (`--rule`), a darker rule (`--ink`) above each numbered section, and plates (1px border on a 20px graph-paper grid) behind figures
- Motion is limited to scroll reveals, the figures and a reading progress bar. Every page honors `prefers-reduced-motion: reduce`, and content stays visible without JavaScript: reveal styles apply only under the `js` class that a script in `<head>` adds

### Main Landing Page (`index.html`)
A single-page portfolio with Jekyll front matter (`layout: null`):
- Layout: a `.cols` grid with a reading column (`main`) and a margin column (`side`) for notes. Sections use CSS subgrid (`.sub`, `.block`) so margin notes line up with their text. Below 1080px the margin collapses and notes follow the text
- Sticky running head with the "JO" logo and anchor links (About, Skills, Projects, Contact); the link for the section in view is highlighted
- Hero: kicker, headline, intro and two text links, with Fig. 1 on the right
- Sections are numbered with CSS counters (`§1`–`§4`; project entries `3.1`, `3.2`): About (text, stats table in the margin), Expertise (skills as a dot-leader list), Work (project entries with tags in the margin, each followed by a figure), Connect (GitHub link)
- Footer: "Designed & Built by Jingwen Ou"

Jekyll Liquid is used only in `<head>`: `{{ site.title }}` and `{{ site.description }}`. Do not use `{{` or `{%` anywhere else in the file.

Figures (vanilla JavaScript, no libraries):
- Fig. 1 (`#fig1`): a tesseract rotating in the XW and ZW planes; drag or the arrow keys rotate it, double-click resets, and the caption shows the current angles
- Fig. 2 (`#fig2`, links to the 8D page): Petrie projection of the 8-cube, plotted one dimension at a time when it scrolls into view
- Fig. 3 (inline SVG, links to the game): jump trajectory schematic; the arc draws in when it scrolls into view
- Canvases are sized with `ResizeObserver` and `devicePixelRatio`; Fig. 1 pauses when off screen

Other behavior:
- The reading progress bar uses a CSS scroll-driven animation (`animation-timeline: scroll()`) with a JS fallback
- Sections fade in on scroll (`.reveal` / `.in-view`, added by JS)
- `prefers-reduced-motion: reduce` stops animations, and Fig. 2 is drawn complete
- Print stylesheet hides the navigation and prints link URLs

### 8D Hypercube Visualization (`8d-hypercube.html`)
A standalone page (no front matter) with its UI written in Traditional Chinese (`lang="zh-TW"`):
- Canvas-based projections of the 8-dimensional hypercube, rendered with vanilla JavaScript (no external libraries)
- Sections, numbered with CSS counters (`§1`–`§8`): octeract statistics (ruled grid), the projection canvas on a plate with the color legend, rotation controls for the 28 planes, four explanatory sections, and a ruled comparison table of hypercubes across dimensions. Formula boxes are numbered as equations with a CSS counter
- Uses the shared visual style; Chinese emphasis (`.title em`) uses the accent color instead of italics
- The first script (rotation math, `draw8DHypercube`, the rotate functions, `autoRotate` / `stopRotation` / `reset8D`) is the original visualization code. The second script wraps the global `autoRotate` / `stopRotation` to toggle the `.running` class; keep these functions global since the buttons call them via inline `onclick`
- Other behavior: reading progress bar, scroll reveal, and a highlight that cycles through the 8D -> 2D dimension nodes
- The canvas edge colors (HSL by the s coordinate) encode data and are independent of the page style
- Links back to the portfolio are relative (`./`, `./#projects`)
- Responsive: single column below 1080px; compact dimension nodes and two-column stats below 640px

### Game Demo (`gemini3-demo.html` and `gemini3-demo/index.html`)
A standalone Super Mario-style platformer written in vanilla JavaScript:
- Canvas-based 2D game with a custom physics engine
- Multiple playable characters (Mario, Thomas the Tank Engine, Teletubby)
- Touch controls for mobile devices
- Web Audio API for sound effects and background music
- Game features: enemies (Goombas), collectible coins, platforms, pipes, and flag goal
- Page chrome uses the shared visual style: a fixed running head with root-relative links (`/`, `/#projects`, so they work from both `/gemini3-demo.html` and `/gemini3-demo/`), a 1px ink frame around the game, a translucent paper start/game-over overlay, outlined character buttons (the selected one in the accent color), keyboard hints on desktop, outlined touch buttons on mobile
- The header, game frame and hints share one width (`.stage`, `--game-w`). The canvas is scaled with CSS to fit the viewport height (`--chrome-h` is the vertical space reserved for everything except the canvas); its internal resolution stays 800x450
- The game script looks up `#start-screen h1` and `#start-screen p` to change the overlay text, so keep a single `h1` and make the start prompt the first `p` inside `#start-screen`

`gemini3-demo/index.html` is an identical copy that exposes the `/gemini3-demo` route. **When editing the game, apply the same change to both files** (or keep them in sync with `cp gemini3-demo.html gemini3-demo/index.html`).

### Legacy React Components (Currently Unused)
- `app.js`: Basic React component with exercises state
- `index.js`: React DOM entry point; it imports `./App` while the file is named `app.js`
- `package-lock.json`: Lock file referencing Material-UI v3.9.3, React, JSS. There is no `package.json`
- `node_modules/` is git-ignored and not present in a fresh clone

These files are not integrated with the Jekyll site and cannot be built as they are.

## File Organization

```
/
├── _config.yml              # Jekyll configuration
├── index.html               # Main portfolio page (Jekyll front matter + HTML/CSS/JS)
├── 8d-hypercube.html        # 8D hypercube projection visualization
├── gemini3-demo.html        # Standalone game demo
├── gemini3-demo/
│   └── index.html           # Copy of the game for the /gemini3-demo route
├── app.js                   # Legacy React component (unused)
├── index.js                 # Legacy React entry (unused)
├── package-lock.json        # NPM lock file (legacy)
├── CLAUDE.md                # This file (excluded from the site)
├── .tool-versions           # asdf: nodejs 22.14.0, ruby 3.4.7
├── .gitignore               # Ignores node_modules/
└── README.md                # Empty
```

## Development Workflow

1. **Local Preview**
   - There is no `Gemfile`. To preview with Jekyll, install it (for example `gem install jekyll`, or the `github-pages` gem for the versions GitHub Pages uses; Ruby is pinned in `.tool-versions`) and run from the repository root:
     ```bash
     jekyll serve
     ```
   - Without Jekyll, `index.html` opened directly shows its front matter as text and the raw Liquid tags in `<head>`. For a quick static preview, use a copy with the first three lines removed and the two Liquid tags replaced
   - `8d-hypercube.html` and the game contain no Liquid and open directly in a browser. The game's root-relative links (`/`, `/#projects`) only work when the site is served from a web server

2. **Verify**: check each changed page at desktop (1440×900), laptop (1280×720) and phone (390×844) sizes: no console errors, no horizontal scrolling, every section visible after scrolling through. Also check with reduced motion and with JavaScript disabled. Playwright works well for this

3. **Deploy**: commit to a feature branch, open a pull request against `gh-pages`, and merge it

## Key Considerations

- **No Build Process**: The site is static HTML/CSS/JS served by Jekyll, no compilation needed
- **Self-Contained Pages**: Each page keeps its CSS and JavaScript inline; style changes must be repeated on every page (see Shared Visual Style)
- **React Components**: The React code is legacy and not used by the site
- **Character Encoding**: Earlier commits fixed emoji encoding issues - prefer text symbols over emoji. The game's sound toggle still uses 🔊 / 🔇, set in both the markup and the game script
- **Language**: `index.html` is in English; `8d-hypercube.html` is in Traditional Chinese; the game page is `zh-TW` with an English header

## Content Updates

To update portfolio sections in `index.html`:
- **Personal Info**: Modify `_config.yml` (title, description) or the hero and About text
- **Skills**: Edit the rows of `dl.leaders` in the `#skills` section (`dt` holds the glyph and group name, `dd` the list)
- **Projects**: Each project is an `article.block.entry` (title link, description, `ul.note.tags`) followed by its `figure`; entry numbers come from CSS counters, so no manual numbering is needed
- **New project pages**: Start from the head, `:root` tokens and running head of `8d-hypercube.html`, link back with `./#projects`, and add an entry and figure to the `#projects` section of `index.html`
- **Contact Links**: Update `.contact-links` in the `#contact` section (currently only GitHub)
- **Stats**: Update `table.facts` in the About section's margin note
