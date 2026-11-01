# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal GitHub Pages portfolio site for Jingwen Ou (oujingwen.github.io) built with Jekyll. The repository contains:
- A light-themed, animated single-page portfolio (`index.html`)
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
A single-page portfolio with Jekyll front matter (`layout: null`) and inline styles:
- Light theme with an orange accent, defined as CSS custom properties on `:root` (`--accent: #ea580c` for decoration, `--accent-strong: #c2410c` for small text and buttons to keep contrast on light backgrounds)
- Google Fonts: Instrument Serif, DM Sans, JetBrains Mono
- Fixed nav with "JO" logo and anchor links (About, Skills, Projects, Contact)
- Hero section with headline, CTA buttons, and visual cards linking to the 8D and game projects plus a "5+ Years" stat
- About section with stats (5+ years experience, 20+ projects, 1M+ lines of code)
- Skills section: Frontend, Backend, Database, Tools
- Projects section with two project cards: "8D Hypercube Visualization" and "Super Mario Browser Game"
- Contact section (GitHub link only) and footer
- Responsive breakpoints at 1024px, 768px, and 480px

Jekyll Liquid is used only in `<head>`: `{{ site.title }}` and `{{ site.description }}`.

Animations:
- CSS keyframes: nav slide-in, word-by-word hero title reveal, shimmering gradient on the title `<em>`, drifting background blobs, floating hero cards, shifting gradients on project images, breathing glow in the contact section
- Hover effects: underline on nav links, sheen on the primary button, lift and shadow on cards, cursor-following spotlight on skill cards
- An inline script at the end of `<body>` handles: scroll progress bar, nav background and active link on scroll, scroll-reveal with staggered cards (`.reveal` / `.in-view` / `.settled` classes, added by JS), count-up numbers (`data-count` / `data-suffix`), and pointer parallax on hero cards
- A script in `<head>` adds the `js` class to `<html>`; reveal styles only hide content under `.js`, so the page stays visible without JavaScript
- `prefers-reduced-motion: reduce` disables animations and transitions

### 8D Hypercube Visualization (`8d-hypercube.html`)
A standalone page (no front matter) with its UI written in Traditional Chinese (`lang="zh-TW"`):
- Canvas-based projections of the 8-dimensional hypercube, rendered with vanilla JavaScript (no external libraries)
- Sections: octeract statistics, six projection views, and a comparison table of hypercubes across dimensions
- Shares the homepage's visual style: same color tokens (`--accent`, `--accent-strong`, etc.), fonts (Instrument Serif / DM Sans / JetBrains Mono, with Noto Serif TC / Noto Sans TC for Chinese), fixed nav with a link back to the portfolio, scroll progress bar, drifting background blobs
- Animations: scroll-reveal for sections and stat cards, count-up stats (`data-count`), staggered table rows, a highlight that cycles through the 8D -> 2D dimension nodes, ripple on button press, pulsing auto-rotate button while rotating
- The animation script at the end of `<body>` wraps the global `autoRotate` / `stopRotation` functions to toggle the `.running` class; keep these functions global since the buttons call them via inline `onclick`
- The canvas edge colors (HSL by the s coordinate) encode data and are independent of the page theme
- `prefers-reduced-motion: reduce` disables animations
- Responsive breakpoint at 768px

### Game Demo (`gemini3-demo.html` and `gemini3-demo/index.html`)
A standalone Super Mario-style platformer written in vanilla JavaScript:
- Canvas-based 2D game with a custom physics engine
- Multiple playable characters (Mario, Thomas the Tank Engine, Teletubby)
- Touch controls for mobile devices
- Web Audio API for sound effects and background music
- Game features: enemies (Goombas), collectible coins, platforms, pipes, and flag goal
- Page chrome shares the homepage's visual style: color tokens, fonts, noise overlay, drifting background blobs, fixed nav with a link back to the portfolio (root-relative `/` links, so they work from both `/gemini3-demo.html` and `/gemini3-demo/`), animated gradient frame around the game, frosted light start/game-over overlay, pill-shaped character buttons, keyboard hints on desktop, light touch buttons on mobile
- The canvas is scaled with CSS to fit the viewport height (`--chrome-h` is the vertical space reserved for everything except the canvas); its internal resolution stays 800x450
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
- **Personal Info**: Modify `_config.yml` (title, description) or hardcoded content in the hero and about sections
- **Skills**: Edit the `skill-card` divs in the `#skills` section
- **Projects**: Add or edit `project-card` links in the `#projects` section; when adding a new project page, consider also linking it from the hero `visual-card` elements
- **Contact Links**: Update the `contact-links` section (currently only GitHub)
- **Stats**: Update the `stat-card` numbers in the about section and the "5+" stat in the hero `card-3`; keep each element's `data-count` and `data-suffix` attributes in sync with its text, since the count-up animation renders from them
