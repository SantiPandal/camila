// Anywhere engine — runs on the Mac mini. Zero dependencies.
//
// ON-DEMAND model (saves RAM): the engine + ngrok are the only always-on pieces
// (~60MB). Emulators (~2GB each) are OFF by default and booted only when you
// `enable` an account, then killed with `disable`. One account = one emulator =
// one person, each with its own Life360 login (persists on the AVD's disk).
//
// Controlled from two places, both hitting this HTTP API:
//   - the Camila "Anywhere" app (phone)
//   - OpenClaw / any agent, via the `anywhere` CLI (see ./anywhere + the skill)
//
//   node server.js            # listens on :8787
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const l360 = require('./l360');
const login = require('./login');

const PORT = process.env.PORT || 8787;
const SDK = process.env.ANDROID_SDK_ROOT || '/opt/homebrew/share/android-commandlinetools';
const JAVA_HOME = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@17';
const ADB = process.env.ADB || `${SDK}/platform-tools/adb`;
const EMULATOR = process.env.EMULATOR || `${SDK}/emulator/emulator`;
const DIR = __dirname;
const ACCOUNTS_FILE = path.join(DIR, 'accounts.json');
const PLACES_FILE = path.join(DIR, 'places.json');
const STATE_FILE = path.join(DIR, 'state.json');

const readJson = (f, fb) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fb;
  }
};
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const getState = () => readJson(STATE_FILE, {});
const setState = (s) => writeJson(STATE_FILE, s);
const accounts = () => readJson(ACCOUNTS_FILE, []);
const findAccount = (idOrLabel) =>
  accounts().find((a) => a.id === idOrLabel || a.label?.toLowerCase() === String(idOrLabel).toLowerCase());

const booting = new Set(); // accountIds whose emulator is mid-boot
const loginStates = {}; // accountId -> 'logged_in' | 'awaiting_code' | 'logged_out'

// --- idle auto-shutoff (safety net for "forgot to toggle off") ---
// You toggle off via the app/`anywhere off`; this just reaps an emulator left
// running with no user activity for a while, so it can't burn RAM for hours.
// Tune with ANYWHERE_IDLE_MIN (minutes); 0 disables the reaper entirely.
const IDLE_MIN = process.env.ANYWHERE_IDLE_MIN != null ? Number(process.env.ANYWHERE_IDLE_MIN) : 90;
const lastActivity = {}; // accountId -> ms of last user action (enable/login/set-location)
const touch = (id) => { lastActivity[id] = Date.now(); };

// --- adb helpers ---
const adb = (args, timeout = 12000) =>
  new Promise((resolve, reject) =>
    execFile(ADB, args, { timeout }, (err, out, errout) =>
      err ? reject(new Error((errout || err.message).trim())) : resolve(out),
    ),
  );

// map AVD name -> running serial
async function runningAvds() {
  const map = {};
  let out = '';
  try {
    out = await adb(['devices']);
  } catch {
    return map;
  }
  const serials = out
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.endsWith('\tdevice'))
    .map((l) => l.split('\t')[0]);
  for (const s of serials) {
    try {
      const name = (await adb(['-s', s, 'emu', 'avd', 'name'])).split('\n')[0].trim();
      if (name) map[name] = s;
    } catch {
      /* ignore */
    }
  }
  return map;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function bootAndPrepare(account) {
  // spawn the emulator headless, detached so it survives engine restarts
  const child = spawn(
    EMULATOR,
    ['-avd', account.avd, '-no-window', '-no-audio', '-no-boot-anim', '-gpu', 'swiftshader_indirect'],
    {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ANDROID_SDK_ROOT: SDK, ANDROID_HOME: SDK, JAVA_HOME, PATH: `${SDK}/platform-tools:${JAVA_HOME}/bin:${process.env.PATH}` },
    },
  );
  child.unref();
  // wait up to ~120s for boot_completed
  for (let i = 0; i < 40; i++) {
    const serial = (await runningAvds())[account.avd];
    if (serial) {
      const b = (await adb(['-s', serial, 'shell', 'getprop', 'sys.boot_completed']).catch(() => '')).trim();
      if (b === '1') {
        await adb(['-s', serial, 'shell', 'settings', 'put', 'secure', 'location_mode', '3']).catch(() => {});
        return serial;
      }
    }
    await sleep(3000);
  }
  throw new Error('emulator did not finish booting in time');
}

async function ensureBooted(account) {
  const avds = await runningAvds();
  return avds[account.avd] || bootAndPrepare(account);
}

async function adbGeoFix(avd, lat, lng) {
  const serial = (await runningAvds())[avd];
  if (!serial) throw new Error(`emulator "${avd}" not running (enable it first)`);
  // geo fix order is <longitude> <latitude>
  await adb(['-s', serial, 'emu', 'geo', 'fix', String(lng), String(lat), '8']);
}

async function pushFor(account, lat, lng) {
  if (account.mode === 'api') return l360.putLocation(account, lat, lng);
  return adbGeoFix(account.avd, lat, lng);
}

const isConfigured = (a) => (a.mode === 'api' ? Boolean(a.token && a.deviceId) : Boolean(a.avd));

async function accountsView() {
  const state = getState();
  const avds = await runningAvds();
  return accounts().map((a) => ({
    id: a.id,
    label: a.label,
    person: a.person || a.label,
    configured: isConfigured(a),
    online: a.mode === 'api' ? isConfigured(a) : Boolean(avds[a.avd]),
    booting: booting.has(a.id),
    loginState: loginStates[a.id] || null,
    current: state[a.id],
  }));
}

// --- jitter: only for online emulator accounts that have a set location ---
setInterval(async () => {
  const avds = await runningAvds();
  const state = getState();
  for (const a of accounts()) {
    const cur = state[a.id];
    if (!cur || a.mode === 'api' || !avds[a.avd]) continue;
    const jLat = cur.lat + (Math.random() - 0.5) * 0.00008;
    const jLng = cur.lng + (Math.random() - 0.5) * 0.00008;
    adbGeoFix(a.avd, jLat, jLng).catch((e) => console.error(`[jitter] ${a.label}: ${e.message}`));
  }
}, 45000);

// --- reaper: kill emulators left idle past ANYWHERE_IDLE_MIN ---
if (IDLE_MIN > 0) {
  const IDLE_MS = IDLE_MIN * 60000;
  setInterval(async () => {
    const avds = await runningAvds();
    for (const a of accounts()) {
      if (a.mode === 'api') continue;
      const serial = avds[a.avd];
      if (!serial) continue;
      // First time we notice a running emulator (e.g. after an engine restart),
      // give it a fresh idle window rather than reaping it instantly.
      if (lastActivity[a.id] == null) { touch(a.id); continue; }
      if (Date.now() - lastActivity[a.id] < IDLE_MS) continue;
      console.log(`[reaper] ${a.label} idle ${IDLE_MIN}m — shutting down to free RAM`);
      await adb(['-s', serial, 'emu', 'kill']).catch(() => {});
      booting.delete(a.id);
      delete lastActivity[a.id];
    }
  }, 60000);
}

// --- http ---
function send(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(obj));
}
const readBody = (req) =>
  new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });
  });
async function viewOf(account) {
  return (await accountsView()).find((v) => v.id === account.id);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && pathname === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && pathname === '/accounts') return send(res, 200, await accountsView());
    if (req.method === 'GET' && pathname === '/places') return send(res, 200, readJson(PLACES_FILE, []));

    if (req.method === 'POST' && pathname === '/places') {
      const { label, lat, lng } = await readBody(req);
      if (!label || typeof lat !== 'number' || typeof lng !== 'number')
        return send(res, 400, { error: 'label, lat, lng required' });
      const places = readJson(PLACES_FILE, []);
      const place = { id: `p_${Date.now()}`, label, lat, lng };
      places.push(place);
      writeJson(PLACES_FILE, places);
      return send(res, 200, place);
    }

    // boot an account's emulator on demand. Returns immediately with booting:true;
    // poll GET /accounts until online:true.
    if (req.method === 'POST' && pathname === '/enable') {
      const { accountId } = await readBody(req);
      const account = findAccount(accountId);
      if (!account) return send(res, 404, { error: 'unknown account' });
      if (account.mode === 'api') return send(res, 200, await viewOf(account));
      touch(account.id);
      const avds = await runningAvds();
      if (avds[account.avd]) return send(res, 200, await viewOf(account));
      if (!booting.has(account.id)) {
        booting.add(account.id);
        bootAndPrepare(account)
          .then(() => console.log(`[enable] ${account.label} ready`))
          .catch((e) => console.error(`[enable] ${account.label}: ${e.message}`))
          .finally(() => booting.delete(account.id));
      }
      return send(res, 202, await viewOf(account));
    }

    // shut down an account's emulator to free RAM
    if (req.method === 'POST' && pathname === '/disable') {
      const { accountId } = await readBody(req);
      const account = findAccount(accountId);
      if (!account) return send(res, 404, { error: 'unknown account' });
      const serial = (await runningAvds())[account.avd];
      if (serial) await adb(['-s', serial, 'emu', 'kill']).catch(() => {});
      booting.delete(account.id);
      return send(res, 200, await viewOf(account));
    }

    // boot (if needed) + drive Life360 to the OTP screen. Returns state:
    //   'awaiting_code' (app should prompt for the code) or 'logged_in' (already in).
    if (req.method === 'POST' && pathname === '/login') {
      const { accountId } = await readBody(req);
      const account = findAccount(accountId);
      if (!account) return send(res, 404, { error: 'unknown account' });
      if (account.mode === 'api') return send(res, 409, { error: 'login is emulator-only' });
      if (!account.email) return send(res, 400, { error: 'account has no email configured' });
      touch(account.id);
      let serial;
      try {
        serial = await ensureBooted(account);
      } catch (e) {
        return send(res, 502, { error: `boot failed: ${e.message}` });
      }
      try {
        const state = await login.driveToCode(serial, account.email);
        loginStates[account.id] = state;
        return send(res, 200, { id: account.id, label: account.label, state });
      } catch (e) {
        return send(res, 502, { error: e.message });
      }
    }

    // submit the 6-digit code the user read from their email, finish login to the map.
    if (req.method === 'POST' && pathname === '/submit-code') {
      const { accountId, code } = await readBody(req);
      const account = findAccount(accountId);
      if (!account) return send(res, 404, { error: 'unknown account' });
      if (!/^\d{4,8}$/.test(String(code || '').replace(/\D/g, '')))
        return send(res, 400, { error: 'valid code required' });
      const serial = (await runningAvds())[account.avd];
      if (!serial) return send(res, 409, { error: 'emulator not running' });
      touch(account.id);
      try {
        const state = await login.submitCode(serial, code);
        loginStates[account.id] = state;
        return send(res, 200, { id: account.id, label: account.label, state });
      } catch (e) {
        return send(res, 400, { error: e.message });
      }
    }

    if (req.method === 'POST' && pathname === '/set-location') {
      const { accountId, lat, lng, placeId } = await readBody(req);
      const account = findAccount(accountId);
      if (!account) return send(res, 404, { error: 'unknown account' });
      if (typeof lat !== 'number' || typeof lng !== 'number')
        return send(res, 400, { error: 'lat, lng required' });
      if (!isConfigured(account)) return send(res, 409, { error: 'account not configured' });
      try {
        await pushFor(account, lat, lng);
      } catch (e) {
        return send(res, 502, { error: e.message });
      }
      touch(account.id); // active use → reset the idle reaper
      const state = getState();
      state[account.id] = { lat, lng, placeId, at: new Date().toISOString() };
      setState(state);
      return send(res, 200, await viewOf(account));
    }

    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => console.log(`Anywhere engine on :${PORT} (on-demand; adb="${ADB}")`));
