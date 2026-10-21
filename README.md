# AquaFlow Water Station Management System

Clean deployment layout for **Netlify frontend + Render backend**.

## Project structure

- `src/` — React/Vite frontend
- `backend/server.js` — Express API
- `public/` — public assets
- `netlify.toml` and `_redirects` — Netlify SPA routing

## Run locally

Terminal 1 (backend):
```bash
cd backend
npm install
npm start
```

Terminal 2 (frontend, from project root):
```bash
npm install
npm run dev
```

The local frontend uses Vite's `/api` proxy to `http://127.0.0.1:8080`. For hosted deployments, set `VITE_API_URL` to the Render service base URL.

## Deploy backend to Render

Create a **Web Service** connected to this repository:

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Set Render environment variable:
- `FRONTEND_URL` = your exact Netlify site origin, such as `https://your-site.netlify.app`. If using a custom domain, include it too, comma-separated.

Render provides `PORT` automatically. Health endpoint:
`https://YOUR-RENDER-SERVICE.onrender.com/api/health`

## Deploy frontend to Netlify

Import the same GitHub repository:

- **Base directory:** leave blank
- **Build command:** `npm run build`
- **Publish directory:** `dist`

Add Netlify environment variable:
- `VITE_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com` (no trailing slash and do not add `/api`).

Trigger a new frontend deploy after changing environment variables.

## Firebase

The project has Firebase Web App defaults in `src/firebase.js`; you can override them with `VITE_FIREBASE_*` variables. In Firebase Console, enable the required sign-in provider and add your Netlify domain under Authentication → Settings → Authorized domains.

## Data persistence warning

The API stores records in a JSON file. The default Render filesystem is not persistent across all redeploys/restarts. For persistent records, attach a Render persistent disk and set `AQUAFLOW_DATA_DIR` to its mount path (for example `/var/data`), or migrate to a managed database such as PostgreSQL. Do not assume records are safely stored until this is configured.

## Security warning before public launch

The current frontend includes demo/local authentication behavior and a demo admin credential constant in `src/services/core-data.js`. Frontend values are visible to visitors and are **not secure admin authentication**. Replace this with server-verified authentication and role checks before using real customer data or taking payments. Never place private keys or passwords in `VITE_*` variables.

## Verify

- Backend health endpoint returns `{ "ok": true, ... }`.
- Frontend opens from Netlify.
- Browser DevTools → Network shows API requests going to the Render service without CORS errors.
- Test login, create/read/update orders, products, inventory, and reports before real use.
