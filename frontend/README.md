# ReviewStream frontend

## Purpose

React UI for ReviewStream: shows App Store customer reviews from the last 48 hours, newest first.
Fetches data from the backend via same-origin `/api` routes (proxied to the backend in dev).

## Invariants

- All API calls use relative `/api/...` URLs; no CORS configuration in the frontend.
- Review cards show author, content, star rating, and submission time (relative and absolute).
- When multiple apps are configured, the user can switch apps; with a single app, the UI still shows which app is active.
- Loading, empty, and error states are explicit; failed app load blocks review fetch; failed review load keeps app selection visible.

## Non-goals & trade-offs

- No client-side routing, state library, or date dependency; timestamps use `Intl` APIs only.
- The 48-hour window and sort order come from the backend; the UI does not re-filter or re-sort.
- Production deployment assumes `/api` is served by the same host as the static assets (or an equivalent reverse proxy).

## Development

From the repo root, start the backend (`npm run dev --workspace backend`) then the frontend:

```bash
npm run dev --workspace frontend
```

The Vite dev server proxies `/api` to `http://localhost:3000`.

Build and lint:

```bash
npm run build --workspace frontend
npm run lint --workspace frontend
```
