# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal GitHub Pages portfolio site for Jingwen Ou (oujingwen.github.io) built with Jekyll. The repository contains:
- A single-page portfolio typeset like a short technical paper (`index.html`)
- An 8-dimensional hypercube (octeract) projection visualization (`8d-hypercube.html`)
- A standalone Super Mario-style browser game (`gemini3-demo.html`, also served at `/gemini3-demo/`)
- Legacy React files (`app.js`, `index.js`, `package-lock.json`) from a previous iteration

## Deployment

- **Platform**: GitHub Pages
- **Branch**: `gh-pages` (this is the main and deployment branch)
- **Remote**: https://github.com/oujingwen/oujingwen.github.io.git
- **Live URL**: https://oujingwen.github.io

Changes pushed to the `gh-pages` branch are automatically deployed to GitHub Pages.

## Architecture

### Jekyll Configuration (`_config.yml`)
- Theme: `jekyll-theme-minimal` (not used by `index.html`, which sets `layout: null`)
- Site title: "Jingwen Ou"
- Description: Personal developer portfolio

### Main Landing Page (`index.html`)
A single-page portfolio with Jekyll front matter (`layout: null`), typeset like a short technical paper:
- Warm paper background, ink text and one ink-blue accent, defined as CSS custom properties on `:root` (`--paper: #f4f0e6`, `--ink: #1c1a15`, `--accent: #2b45b5`). Light only; there is no dark theme
- Google Fonts: Newsreader (text, uses optical sizes) and IBM Plex Mono (labels, captions, navigation)
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
- Sections fade in on scroll (`.reveal` / `.in-view`, added by JS); a script in `<head>` adds the `js` class, so content stays visible without JavaScript
- `prefers-reduced-motion: reduce` stops animations, and Fig. 2 is drawn complete
- Print stylesheet hides the navigation and prints link URLs

### 8D Hypercube Visualization (`8d-hypercube.html`)
A standalone page (no front matter) with its UI written in Traditional Chinese (`lang="zh-TW"`):
- Canvas-based projections of the 8-dimensional hypercube, rendered with vanilla JavaScript (no external libraries)
- Sections: octeract statistics, the projection canvas, rotation controls for the 28 planes, four explanatory sections, and a comparison table of hypercubes across dimensions
- Same paper style as `index.html`: color tokens (`--paper`, `--ink`, `--accent: #2b45b5`), the `.cols` layout with a reading column and wide blocks, a sticky running head with "JO" and a link back to the portfolio, sections numbered with CSS counters (`§1`–`§8`), formula boxes numbered as equations, and a ruled comparison table
- Fonts: Newsreader and IBM Plex Mono, with Noto Serif TC / Noto Sans TC for Chinese. Chinese emphasis (`.title em`) uses the accent color instead of italics
- The first script (rotation math, `draw8DHypercube`, the rotate functions, `autoRotate` / `stopRotation` / `reset8D`) is the original visualization code. The second script wraps the global `autoRotate` / `stopRotation` to toggle the `.running` class; keep these functions global since the buttons call them via inline `onclick`
- Other behavior: reading progress bar, scroll reveal, and a highlight that cycles through the 8D -> 2D dimension nodes
- The canvas edge colors (HSL by the s coordinate) encode data and are independent of the page theme
- `prefers-reduced-motion: reduce` disables animations
- Responsive: single column below 1080px; compact dimension nodes and two-column stats below 640px

### Game Demo (`gemini3-demo.html` and `gemini3-demo/index.html`)
A standalone Super Mario-style platformer written in vanilla JavaScript:
- Canvas-based 2D game with a custom physics engine
- Multiple playable characters (Mario, Thomas the Tank Engine, Teletubby)
- Touch controls for mobile devices
- Web Audio API for sound effects and background music
- Game features: enemies (Goombas), collectible coins, platforms, pipes, and flag goal
- Page chrome uses the same paper style as `index.html`: color tokens, Newsreader / IBM Plex Mono (Noto Sans TC for Chinese), a fixed running head with "JO" and a link back to the portfolio (root-relative `/` links, so they work from both `/gemini3-demo.html` and `/gemini3-demo/`), a 1px ink frame around the game, a translucent paper start/game-over overlay, outlined character buttons (the selected one in the accent color), keyboard hints on desktop, outlined touch buttons on mobile
- The header, game frame and hints share one width (`.stage`, `--game-w`). The canvas is scaled with CSS to fit the viewport height (`--chrome-h` is the vertical space reserved for everything except the canvas); its internal resolution stays 800x450
- The game script looks up `#start-screen h1` and `#start-screen p` to change the overlay text, so keep a single `h1` and make the start prompt the first `p` inside `#start-screen`

`gemini3-demo/index.html` is an identical copy that exposes the `/gemini3-demo` route. **When editing the game, apply the same change to both files** (or keep them in sync with `cp gemini3-demo.html gemini3-demo/index.html`).

### Legacy React Components (Currently Unused)
- `app.js`: Basic React component with exercises state
- `index.js`: React DOM entry point
- `package-lock.json`: Lock file referencing Material-UI v3.9.3, React, JSS
- `node_modules/` is git-ignored and not present in a fresh clone

These files are not integrated with the current Jekyll site.

## File Organization

```
/
├── _config.yml              # Jekyll configuration
├── index.html               # Main portfolio page (Jekyll + HTML/CSS)
├── 8d-hypercube.html        # 8D hypercube projection visualization
├── gemini3-demo.html        # Standalone game demo
├── gemini3-demo/
│   └── index.html           # Copy of the game for the /gemini3-demo route
├── app.js                   # Legacy React component (unused)
├── index.js                 # Legacy React entry (unused)
├── package-lock.json        # NPM lock file (legacy)
├── .tool-versions           # asdf: nodejs 22.14.0, ruby 3.4.7
├── .gitignore               # Ignores node_modules/
└── README.md                # Empty
```

## Development Workflow

Since this is a Jekyll-based GitHub Pages site:

1. **Local Preview**: Use Jekyll to preview changes locally (Ruby version is pinned in `.tool-versions`):
   ```bash
   jekyll serve
   ```
   Or with bundler:
   ```bash
   bundle exec jekyll serve
   ```
   The standalone pages (`8d-hypercube.html`, `gemini3-demo.html`) contain no Liquid and can also be opened directly in a browser.

2. **Edit Content**: Modify the HTML files directly or update `_config.yml` for site metadata

3. **Deploy**: Push changes to the `gh-pages` branch:
   ```bash
   git add .
   git commit -m "Update portfolio"
   git push origin gh-pages
   ```

## Key Considerations

- **No Build Process**: The site is static HTML/CSS/JS served by Jekyll, no compilation needed
- **Self-Contained Pages**: Each page keeps its CSS and JavaScript inline; there are no shared stylesheets or scripts
- **React Components**: The React code is legacy and not used by the site
- **Character Encoding**: Earlier commits fixed emoji encoding issues - prefer text symbols over emoji when possible
- **Language**: `index.html` is in English; `8d-hypercube.html` and the game are in Traditional Chinese (`zh-TW`)

## Content Updates

To update portfolio sections in `index.html`:
- **Personal Info**: Modify `_config.yml` (title, description) or the hero and About text
- **Skills**: Edit the rows of `dl.leaders` in the `#skills` section (`dt` holds the glyph and group name, `dd` the list)
- **Projects**: Each project is an `article.block.entry` (title link, description, `ul.note.tags`) followed by its `figure`; entry numbers come from CSS counters, so no manual numbering is needed
- **Contact Links**: Update `.contact-links` in the `#contact` section (currently only GitHub)
- **Stats**: Update `table.facts` in the About section's margin note
