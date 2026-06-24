# Anywhere engine

Runs on the Mac mini. Sets Life360 location for ~4 accounts on behalf of the
Camila "Anywhere" mini-app. The phone hits this server; this server hits Life360.

**Two implementations, same app-facing API:**

1. **Primary — Life360 write API (no emulator).** `PUT /v4/locations` with raw lat/lng
   + bearer token. Confirmed live June 2026. Setup: **`API-SETUP.md`**. ← use this.
2. **Fallback — Android emulator.** `adb emu geo fix` into an AVD running Life360.
   Heavier; only if the API path dies. Setup: `../anywhere-spike-runbook.md`.

`server.js` ships the **API implementation** (zero dependencies).

## Quick start (API path)

```bash
node setup-account.js --token <bearer> --label "Santi" --id a_santi   # see API-SETUP.md step 1-2
cp accounts.example.json accounts.json   # paste the printed entries
cp places.example.json   places.json     # your saved places
node server.js                            # listens on :8787
ngrok http 8787                           # paste https URL into the Camila app .env
```

Set `EXPO_PUBLIC_ANYWHERE_API_URL` in the Camila `.env` to that URL, restart Expo.

## API (what the app calls)

- `GET  /accounts`     → accounts with `online` + last `current` location (no secrets)
- `GET  /places`       → saved places
- `POST /places`       → `{ label, lat, lng }`
- `POST /set-location` → `{ accountId, lat, lng, placeId? }`
- `GET  /health`       → `{ ok: true }`

## Files

- `l360.js` — Life360 client (login, device-id discovery, location write)
- `server.js` — the engine (HTTP server + jitter loop)
- `setup-account.js` — one-time per-account token + device-id discovery
- `accounts.json` / `places.json` / `state.json` — local runtime data, **git-ignored**
  (`.gitignore` here). These hold emails + home/work coordinates — never commit them.

## Deployment (durable home on the Mac mini)

This engine is tracked in the Camila repo and runs from the repo's durable checkout
**`~/conductor/repos/camila/anywhere-engine/`** (NOT an ephemeral Conductor workspace),
under a launchd LaunchAgent so it survives crashes and reboots.

```bash
./install.sh          # symlinks `anywhere` onto PATH + loads the LaunchAgent
launchctl list | grep anywhere-engine
anywhere list         # smoke test (CLI is on PATH after install)
```

- LaunchAgent: `launchd/com.santipandal.anywhere-engine.plist` (`RunAtLoad`+`KeepAlive`).
- The real `accounts.json` / `places.json` / `state.json` live next to `server.js` on
  the mini (git-ignored), seeded once from your data — they are NOT in the repo.
- `ngrok http 8787` is still a bare process; the engine itself is now the durable piece.

## On-demand emulators (RAM)

Emulators (~2GB each) are OFF by default. `anywhere on <person>` / the app toggle boots
one; `anywhere off <person>` kills it. Safety net: an idle emulator with no user activity
for `ANYWHERE_IDLE_MIN` minutes (default 90, `0`=off) is auto-reaped so a forgotten one
can't burn RAM for hours.

## Notes

- Tokens live in `accounts.json` on this machine only — never sent to the app.
- Jitter loop re-pushes each pin every ~45s (~5m offset) so it drifts and stays "live".
- One reporting identity per account: don't also run Life360 on the phone for that
  account, or the two will fight. See `API-SETUP.md`.
