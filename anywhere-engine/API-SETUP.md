# Anywhere — API path (primary, no emulator)

Life360's app reports its own position with a plain `PUT /v4/locations` (raw lat/lng
in a base64 header + bearer token — **no Play Integrity, no attestation, no signed
request**). Confirmed live June 2026. So the engine just calls that endpoint; **no
Android emulator anywhere in the loop.** Your phone hits the engine; the engine hits
Life360.

```
Camila app  →  POST /set-location {accountId, lat, lng}
                      ↓ ngrok / LAN
Mac mini engine  →  PUT https://iphone.life360.com/v4/locations
                      (X-UserContext: base64 coords, X-Device-ID, Bearer token)
```

## One-time setup per account

1. **Get a bearer token (robust path — avoids the login captcha):**
   - Log into <https://app.life360.com> in a browser with that account.
   - DevTools → Network → click any request to `life360.com` → copy the
     `Authorization: Bearer <token>` value.
2. **Discover the device-id Life360 will accept** (must be a real device on the account —
   open the Life360 app on a phone at least once so a device exists):
   ```bash
   cd .context/anywhere-engine
   node setup-account.js --token <bearer> --label "Santi" --id a_santi
   ```
   It prints a ready `{ id, label, token, deviceId }` block.
3. Paste each block into `accounts.json` (copy from `accounts.example.json`).
   Add `places.json` (copy from `places.example.json`).
4. Run it:
   ```bash
   node server.js          # listens on :8787
   ngrok http 8787         # paste the https URL into the Camila app .env
   ```
   Set `EXPO_PUBLIC_ANYWHERE_API_URL` to the ngrok URL (or `http://<mac-mini-lan-ip>:8787`),
   restart Expo. The Anywhere panel now one-taps each account to a saved place.

## What stays true regardless of API vs emulator

- **One reporting identity per account.** If the real phone app is running, it also
  pushes location and will fight the engine. Cleanest: don't run Life360 on the phone for
  that account — let the engine be the only thing reporting. (Same "don't toggle" rule as
  the emulator plan, minus the emulator.)
- **The Mac mini stays on.** The engine re-pushes every ~45s (with ~5m jitter) so the pin
  drifts naturally and shows "live"; if the engine is off, Life360 shows a stale
  "updated X ago", itself a tell.

## Risks / failure modes

- **Token expiry.** Bearer tokens expire. When pushes start returning 401, grab a fresh
  token (step 1) and update `accounts.json`. (Auto-refresh via username/password is
  possible but hits Cloudflare/2FA — token-paste is the reliable path.)
- **Endpoint/token rotation.** The Basic login token and endpoints are reverse-engineered
  and rotate occasionally. If `setup-account.js` starts 403'ing, the public Basic token in
  `l360.js` may have rotated — re-source it, or fall back to the emulator path
  (`../anywhere-spike-runbook.md`).
- **ToS.** This is against Life360's Terms. Your account, your call.

## Liveness check (no credentials)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT https://iphone.life360.com/v4/locations
# 400 = endpoint alive (wants auth+body).  404 = gone (path changed).
```

## Emulator path = fallback only

If Life360 ever kills the API write path, the Android-emulator approach
(`../anywhere-spike-runbook.md`) still works (`adb emu geo fix` feeds GPS through the HAL,
so it isn't flagged as mock). It's heavier (24/7 emulator, Play Integrity questions), so
it's the backup, not the primary.
