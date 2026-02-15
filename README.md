# Delegate (Static GitHub Pages PWA)

This is a **zero-build** (no Node required) single-page app designed to run directly on **GitHub Pages** and behave like a **PWA**.

## Features
- Projects with customizable workflow steps (like: Planner → PM Approval → Step 1 → QA → Done)
- Task list + Kanban board
- Assign users (workers) to tasks + roles
- Drag & drop tasks between workflow steps
- Data is **seeded from JSON files** and then saved to **localStorage** (because GitHub Pages is static / read-only)
- Import/Export your data as JSON

## Deploy on GitHub Pages (repo: `amyxdclark/delegate`)
1. Copy the contents of this zip into the **root** of your repo.
2. In GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
3. Visit the provided Pages URL.

> Tip: If you prefer deploying from `/docs`, move everything into a `docs/` folder and select that folder in Pages settings.

## Local run
Just open `index.html` in a browser, or serve it:
- Python: `python -m http.server 8080`

## Data model
- `data/seed.json` is the initial seed
- Your edits are stored in browser storage under: `delegate:data:v1`

## PWA
- `manifest.webmanifest` defines the app name/icons
- `sw.js` caches app shell + seed data for offline use

## Notes
- This is intentionally simple and GitHub Pages-friendly.
- If you later want a Vite/React build, keep the same data model and UI ideas and swap the frontend.
