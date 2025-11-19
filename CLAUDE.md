# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal GitHub Pages portfolio site for Jingwen Ou (oujingwen.github.io) using Jekyll with the minimal theme. The repository contains:
- A Jekyll-based personal landing page with modern styling (`index.html`)
- Legacy React components (`app.js`, `index.js`) from a previous iteration
- A standalone game demo (`gemini3-demo.html`) - a Super Mario browser game

## Deployment

- **Platform**: GitHub Pages
- **Branch**: `gh-pages` (this is the main and deployment branch)
- **Remote**: https://github.com/oujingwen/oujingwen.github.io.git
- **Live URL**: https://oujingwen.github.io

Changes pushed to the `gh-pages` branch are automatically deployed to GitHub Pages.

## Architecture

### Jekyll Configuration (`_config.yml`)
- Theme: `jekyll-theme-minimal`
- Site title: "Jingwen Ou"
- Description: Personal developer portfolio

### Main Landing Page (`index.html`)
A single-page portfolio with Jekyll front matter and inline styles featuring:
- Hero section with gradient background
- About section with stats (years experience, projects, lines of code)
- Skills section showcasing frontend, backend, database, and tools
- Projects section (currently showing "Coming Soon")
- Contact section with GitHub link
- Fully responsive design with mobile breakpoints

The page uses Jekyll templating (`{{ site.title }}`, `{{ site.description }}`) for dynamic content.

### Game Demo (`gemini3-demo.html`)
A standalone Super Mario-style platformer game written in vanilla JavaScript:
- Canvas-based 2D game with custom physics engine
- Multiple playable characters (Mario, Thomas the Tank Engine, Teletubby)
- Touch controls for mobile devices
- Web Audio API for sound effects and background music
- Game features: enemies (Goombas), collectible coins, platforms, pipes, and flag goal

### Legacy React Components (Currently Unused)
- `app.js`: Basic React component with exercises state (184 bytes)
- `index.js`: React DOM entry point (134 bytes)
- Dependencies in `node_modules/` include Material-UI v3.9.3, React, JSS

These React files appear to be from an older project and are not integrated with the current Jekyll site.

## File Organization

```
/
├── _config.yml           # Jekyll configuration
├── index.html            # Main portfolio page (Jekyll + HTML/CSS)
├── gemini3-demo.html     # Standalone game demo
├── app.js                # Legacy React component (unused)
├── index.js              # Legacy React entry (unused)
├── node_modules/         # React dependencies (legacy)
├── package-lock.json     # NPM lock file (legacy)
└── README.md             # Empty
```

## Development Workflow

Since this is a Jekyll-based GitHub Pages site:

1. **Local Preview**: Use Jekyll to preview changes locally:
   ```bash
   jekyll serve
   ```
   Or with bundler:
   ```bash
   bundle exec jekyll serve
   ```

2. **Edit Content**: Modify `index.html` directly or update `_config.yml` for site metadata

3. **Deploy**: Push changes to the `gh-pages` branch:
   ```bash
   git add .
   git commit -m "Update portfolio"
   git push origin gh-pages
   ```

## Key Considerations

- **No Build Process**: The site is static HTML/CSS served by Jekyll, no compilation needed
- **React Components**: The React code (`app.js`, `index.js`, `node_modules/`) is legacy and not currently used by the site
- **Inline Styles**: The main landing page uses inline `<style>` tags rather than external CSS files
- **Character Encoding**: Recent commits mention fixing emoji encoding issues - prefer text symbols over emoji when possible
- **Mobile-First**: The landing page includes responsive breakpoints for tablets (768px) and phones (480px)

## Content Updates

To update portfolio sections in `index.html`:
- **Personal Info**: Modify `_config.yml` (title, description) or hardcoded content in about section
- **Skills**: Edit the skills-grid section skill-card divs
- **Projects**: Replace the "Coming Soon" project-card with actual project data
- **Contact Links**: Update contact-links section (currently only GitHub link present)
- **Stats**: Update about-stats numbers (currently: 5+ years, 20+ projects, 1M+ lines of code)
