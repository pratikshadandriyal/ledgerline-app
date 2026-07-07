# Ledgerline

An expense tracker built with React, Recharts, and PapaParse.

## Run locally

```
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## Build for production

```
npm run build
```

This creates a `dist/` folder with static files ready to deploy anywhere.

## Deploy (free options)

**Vercel (recommended, easiest)**
1. Push this folder to a GitHub repo.
2. Go to vercel.com, sign in with GitHub, click "New Project," pick the repo.
3. Vercel auto-detects Vite — just click Deploy.

**Netlify**
1. Push this folder to a GitHub repo, or drag-and-drop the `dist/` folder (after `npm run build`) directly onto app.netlify.com/drop.
2. If using GitHub: build command `npm run build`, publish directory `dist`.

**GitHub Pages**
Works too, but needs an extra `base` setting in `vite.config.js` matching your repo name — ask if you want this path.

## Notes

- All data is in-memory only (resets on page refresh) — this is a demo/portfolio version.
- To make data persist for real users, connect a backend (e.g. Supabase) and swap the in-memory `useState` calls in `App.jsx` for database reads/writes.
