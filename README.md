# Cricket Scorer

Live cricket scoring for friendly tournaments.

- **/** – public live scores: live matches, ball-by-ball commentary, scorecards, points table, stats.
  Anyone with the link can watch. Nobody can change anything.
- **/admin** – organiser only (password). Set up tournaments and teams, and score ball by ball.
- **/tv** – big-screen scoreboard for a TV or laptop. Updates by itself.

## Deploy on Vercel
1. Put this folder in a GitHub repository (or run `npx vercel` inside it).
2. vercel.com → **Add New → Project** → import it → **Deploy** (no framework, no build command).
3. Project → **Storage** (or **Marketplace**) → add **Upstash Redis** (free plan) → connect it to the project.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
4. Project → **Settings → Environment Variables** → add `ADMIN_PASSWORD` with a password only you know.
5. **Deployments → Redeploy** so both settings take effect.

## On match day
1. Open `https://your-app.vercel.app/admin` on the scorer's phone and log in (stays logged in for 30 days).
2. Create the tournament, then tap **New match**.
3. Share `https://your-app.vercel.app/` in your group chat. Open `https://your-app.vercel.app/tv` on the TV.
4. If the signal drops, keep scoring. Balls are saved on the phone and sent when it reconnects.

## Data
- Tournaments are kept in Upstash Redis with no expiry, and on the scorer's phone, until you tap
  **Delete this tournament**. Old tournaments stay viewable on the public site.
- **Backup → Copy backup** gives text you can paste into **Restore backup** on any device.
- Changing `ADMIN_PASSWORD` logs out every scoring device.

## Files
- `index.html` – the whole site (built from `cricket.html` with `python3 build.py cricket.html`)
- `api/state.js` – read tournaments (public) and save them (admin)
- `api/login.js` – admin password check
- `api/_lib.js` – shared helpers
- `vercel.json` – makes `/admin` and `/tv` open the app
