# RF Alliance Roster (`RFALL`)

A zero-framework, Material Design 3 web application for managing alliances, members, and alliance logos with persistent, secured multi-tenant storage on PocketBase (`https://db.zece.info`).

## Architecture & Security Compliance

This application adheres to the PocketBase Multi-Tenant Security standard:
- **Backend URL**: `https://db.zece.info`
- **Assigned Prefix**: `RFALL_` (Collections: `RFALL_alliances`, `RFALL_logs`)
- **Dedicated Project User**: `rfall@zece.info` (created in central `users` collection)
- **Least Privilege API Rules**: All 5 API rules (`list`, `view`, `create`, `update`, `delete`) on `RFALL_*` collections are strictly locked to:
  ```json
  "@request.auth.email = 'rfall@zece.info'"
  ```
- **Runtime Auth & Auto-Refresh**: Tokens last up to 5 days. The client automatically authenticates as `rfall@zece.info`, caches the JWT locally, and auto-refreshes seamlessly on HTTP 401 responses.
- **Root Superuser Protection**: Superuser credentials (`bocanceatv@gmail.com`) are never tracked, hardcoded, or exposed in frontend code.

## Files

- `index.html` — Semantic Material Design 3 application shell, dialogs, and side sheets
- `styles.css` — Material Design 3 solid/tonal design tokens (light & dark themes, zero gradients)
- `pb.js` — Lightweight PocketBase REST + Realtime SSE client with automatic authentication and token lifecycle management
- `app.js` — State management, card grid, centered logos, hover popovers, CSV sync, and audit logging
- `index.php` — Optional drop-in PHP launcher & server-side token cache for basic shared PHP hosting
- `.htaccess` — Apache configuration with index routing and token file protection

## PocketBase Collections

- **`RFALL_alliances`**
  - `code` (`text`, required) — Alliance number/code (e.g. `01`–`30`)
  - `name` (`text`, required) — Alliance name
  - `color` (`text`, required) — Hex color (`#RRGGBB`)
  - `members` (`text`) — Comma-separated member names
  - `robots` (`text`) — Comma-separated robot names
  - `notes` (`text`) — Alliance notes
  - `logo` (`file`) — Alliance logo image (`png`, `jpg`, `webp`, `svg`, `gif`, max 5 MB, thumbs `128x128`, `256x256`)
  - `sort_order` (`number`) — Numeric sort order
  - `created`, `updated` (`autodate`)
- **`RFALL_logs`**
  - `alliance_code` (`text`)
  - `alliance_name` (`text`, required)
  - `action` (`text`, required)
  - `details` (`text`)
  - `created` (`autodate`)

## Deployment to Basic Hosting

The project is designed to be **100% plug-and-play** on any hosting environment with **zero build steps, zero node_modules, and zero composer dependencies**.

### Option A: Shared PHP Hosting (cPanel, Apache, Plesk, etc.)
Simply upload the contents of the `RFcolor` folder into your `public_html` (or subfolder).
Apache/LiteSpeed will automatically run `index.php` or `index.html`.

### Option B: Static Web Hosting (GitHub Pages, Netlify, Cloudflare Pages)
Upload the contents of `RFcolor`. `index.html` runs directly in the browser and connects securely to `https://db.zece.info` via `pb.js`.

### Local Testing
Run with Python:
```bash
python -m http.server 8080
```
Or run with PHP:
```bash
php -S localhost:8080
```
Open `http://localhost:8080` in your browser.
