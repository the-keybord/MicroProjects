# RF Alliance Roster

A zero-framework, static Material Design 3 web application for managing alliances, members, and alliance logos with persistent storage on PocketBase (`https://db.zece.info`).

## Files

- `index.html` — Application shell, dialogs, and side sheet
- `styles.css` — Material Design 3 solid/tonal design tokens (light & dark themes)
- `pb.js` — Lightweight zero-dependency PocketBase REST + Realtime SSE client
- `app.js` — State management, logo upload/preview, search/filter/sort, CSV sync, and activity logging

## PocketBase Collections

All collections created for this app use the `RFALL` prefix on `https://db.zece.info`:

- `RFALL_alliances`
  - `code` (`text`, required) — Alliance number/code (e.g. `01`–`30`)
  - `name` (`text`, required) — Alliance name
  - `color` (`text`, required) — Hex color (`#RRGGBB`)
  - `members` (`text`) — Comma-separated member names (empty = Available unless `robots` is set)
  - `robots` (`text`) — Comma-separated robot names
  - `notes` (`text`) — Optional notes
  - `logo` (`file`) — Alliance logo image (`png`, `jpg`, `webp`, `svg`, `gif`, max 5 MB, thumbs `128x128` and `256x256`)
  - `sort_order` (`number`) — Integer sort order
  - `created`, `updated` (`autodate`)
- `RFALL_logs`
  - `alliance_code` (`text`)
  - `alliance_name` (`text`, required)
  - `action` (`text`, required)
  - `details` (`text`)
  - `created` (`autodate`)

## Hosting

Because the app uses plain HTML, CSS, and vanilla JavaScript with no build step, it can be deployed on any static web host (GitHub Pages, Netlify, Cloudflare Pages, Vercel static, Nginx, Apache, or `python -m http.server`).

Local preview:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

