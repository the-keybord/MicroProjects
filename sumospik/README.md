# SumoSpik — Sumobot Scoring & Tournament Engine (`sumospik`)

A Material Design 3 web application for managing Sumobot tournaments, team registrations, match schedules, live Dohyo ring referee scoring, and real-time leaderboards with persistent, multi-tenant storage on PocketBase (`https://db.zece.info`).

## Features

- **Multi-Championship Architecture**: Create and switch between multiple tournaments, leagues, and weight classes (Standard 3kg, Mini Sumo 500g, Micro Sumo, Lego Sumo) in the same app.
- **Automated Schedule Generator**:
  - Single Round Robin (Berger algorithm)
  - Double Round Robin
  - Custom number of matches with automatic Red/Blue corner balancing
- **Interactive Matches Grid**:
  - Filterable by Round (Round 1, Round 2, etc.) and Status (Scheduled, Live, Finished)
  - Dual-corner presentation: Red Corner (Higashi) vs Blue Corner (Nishi)
  - Winner badge highlights and real-time score display
- **Live Dohyo Referee Console**:
  - Split-screen Red vs Blue arena scoring
  - Digital LED countdown timer (Start, Pause, Reset, +15s, -15s)
  - Web Audio API Sound Synthesizer: Whistle on start, pleasant ascending chime on Yuko point, 10s warning ticks, and end-of-round buzzer (zero external audio files required!)
  - Yuko round indicators (best-of-3, best-of-5, or sudden death)
  - One-click "Finish & Save Match" syncing instantly to PocketBase
- **Live Standings & Leaderboard Table**:
  - Automatically recalculates Matches Played (MP), Wins (W), Losses (L), Draws (D), Rounds Won/Lost, Round Differential, and Total Points (PTS)
  - Gold, Silver, and Bronze medal badges
- **Team Management**: Single team registration, color swatch selection, and fast multi-line Bulk Team Registration.
- **PocketBase Realtime SSE**: Live synchronization across multiple referee tablets and spectator screens simultaneously.

## PocketBase Collections & Security

Compliant with the **PocketBase Backend & Multi-Tenant Security** standard:
- **Backend URL**: `https://db.zece.info`
- **Assigned Prefix**: `sumospik_`
- **Dedicated Project Service User**: `sumospik@zece.info` (in central `users` collection)
- **Least-Privilege API Rules**: All 5 rules (`list`, `view`, `create`, `update`, `delete`) on every collection are locked to:
  ```json
  "@request.auth.email = 'sumospik@zece.info'"
  ```

### Collections Schema

1. **`sumospik_championships`**
   - `name` (`text`, required)
   - `category` (`text`) — Weight class / category
   - `format` (`text`) — Tournament format
   - `match_format` (`text`) — Best of 1 / 3 / 5
   - `round_time_sec` (`number`) — Round duration in seconds (default: 180s)
   - `points_win`, `points_draw`, `points_loss` (`number`) — Points rules
   - `status` (`text`) — active, completed, draft
   - `notes` (`text`)
2. **`sumospik_teams`**
   - `championship_id` (`text`, required) — Foreign key to championship
   - `name` (`text`, required) — Team name
   - `robot_name` (`text`) — Robot name
   - `club` (`text`) — Club / school / city
   - `color` (`text`) — Hex color
   - `avatar` (`file`) — Team logo / robot photo
   - `matches_played`, `wins`, `losses`, `draws`, `rounds_won`, `rounds_lost`, `points`
3. **`sumospik_matches`**
   - `championship_id` (`text`, required)
   - `round_num` (`number`) — Round number
   - `match_num` (`number`) — Sequence number
   - `stage` (`text`)
   - `team1_id`, `team2_id` (`text`) — Team record IDs
   - `team1_score`, `team2_score` (`number`)
   - `winner_id` (`text`)
   - `is_draw` (`bool`)
   - `status` (`text`) — scheduled, live, finished
   - `duration_sec` (`number`)
4. **`sumospik_settings`**
   - `key` (`text`, required)
   - `value` (`json`)

## Deployment to Basic Hosting

The application is completely self-contained with **zero build steps, zero node_modules, and zero composer dependencies**.

### Option A: Static Web Hosting (GitHub Pages, Netlify, Cloudflare Pages)
Upload the `sumospik` folder. `index.html` runs directly in any browser and handles auth/realtime through `pb.js`.

### Option B: Basic Shared PHP Hosting (cPanel, Apache, LiteSpeed)
Upload the `sumospik` folder to your server. `index.php` and `.htaccess` are pre-configured to cache the JWT token locally in `sys_get_temp_dir()` and serve the application out of the box.

### Local Testing
With Python:
```bash
python -m http.server 8080 -d sumospik
```
Or with PHP:
```bash
php -S localhost:8080 -t sumospik
```
Open `http://localhost:8080`.
