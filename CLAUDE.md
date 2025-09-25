# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Pages site using Jekyll with the minimal theme. The repository contains a mixed setup:
- Jekyll configuration for GitHub Pages hosting (`_config.yml`)
- React components (`app.js`, `index.js`) for a web application
- GitHub Pages deployment on the `gh-pages` branch

## Key Architecture

- **Jekyll Site**: Configured with minimal theme, title "Octocat's homepage"
- **React Components**:
  - `app.js`: Main App component with exercises state management
  - `index.js`: Entry point rendering App component to DOM root
- **Deployment**: Uses GitHub Pages with `gh-pages` as the main branch

## Development Notes

- No package.json in root - React dependencies managed via node_modules
- No build scripts or test commands configured
- Jekyll serves static content while React components provide dynamic functionality
- Empty index.html and README.md files suggest incomplete setup

## File Structure

- `_config.yml`: Jekyll configuration
- `app.js`: React App component
- `index.js`: React entry point
- `index.html`: Empty HTML file
- `node_modules/`: React dependencies