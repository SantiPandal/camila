// Minimal Life360 client (zero-dependency, native https).
// Reverse-engineered endpoints — read AND write. The write path (PUT /v4/locations)
// takes raw lat/lng in a base64 header + bearer token; no Play Integrity / attestation.
// Protocol confirmed live June 2026. Endpoints rotate occasionally; if a call starts
// returning 403/401, refresh the token (see setup-account.js) or re-check the Basic token.
const https = require('https');

// Public web-client Basic token used only for the password-grant login.
// (Googleable/sniffable; Life360 rotates it. Same one the desktop spoofer uses.)
const BASIC_AUTH =
  'Basic OWE5MDc4YTcxMjRkNjFkYjc1NGNjNzI4NjY2OTRkNWYwNDk2ODY2NDA6NjA2Nzk3MzkwODViYmMxZWY2ZjQyZjlmMDc3YjIwNTA=';
const UA = 'com.life360.android.safetymapd/KOKO version: 23.49.0 android XX:XX:XX:XX:XX:XX';

function call(method, urlStr, { token, basic, headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const h = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': UA,
      Origin: 'https://app.life360.com',
      Referer: 'https://app.life360.com/',
      ...headers,
    };
    if (token) h.Authorization = `Bearer ${token}`;
    else if (basic) h.Authorization = BASIC_AUTH;
    if (payload) h['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(
      { method, hostname: url.hostname, path: url.pathname + url.search, headers: h, timeout: 15000 },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            /* non-json body */
          }
          resolve({ status: res.statusCode, body: data, json });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// --- auth / discovery (used by setup-account.js) ---
async function login(username, password) {
  const r = await call('POST', 'https://api-cloudfront.life360.com/v3/oauth2/token.json', {
    basic: true,
    body: { grant_type: 'password', username, password },
  });
  if (r.json?.access_token) return r.json.access_token;
  throw new Error(`login ${r.status}: ${r.body?.slice(0, 300)}`);
}

async function getUserId(token) {
  const r = await call('GET', 'https://api-cloudfront.life360.com/v3/users/me', { token });
  if (r.json?.id) return r.json.id;
  throw new Error(`users/me ${r.status}: ${r.body?.slice(0, 200)}`);
}

async function getCircles(token) {
  const r = await call('GET', 'https://api-cloudfront.life360.com/v3/circles', { token });
  return r.json?.circles ?? [];
}

async function getDeviceId(token, circleId, userId) {
  const r = await call('GET', 'https://api-cloudfront.life360.com/v5/circles/devices', {
    token,
    headers: {
      'ce-id': '92388394-B6FB-5EE5-30EC-5F814CF204AD',
      'ce-type': 'com.life360.cloud.platform.devices.v1',
      'ce-source': '/iOS',
      'ce-time': new Date().toISOString(),
      'ce-specversion': '1.0',
      circleid: circleId,
    },
  });
  const items = r.json?.data?.items ?? [];
  const mine = items.find((it) => it.owners?.[0]?.userId === userId);
  return { deviceId: mine?.id ?? null, items, status: r.status };
}

// --- the write path ---
async function putLocation({ token, deviceId }, lat, lng, opts = {}) {
  const ctx = {
    geolocation: {
      lat: String(lat),
      lon: String(lng),
      alt: '0.0',
      accuracy: '10.00',
      heading: '0.0',
      speed: '0.0',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      age: '0',
    },
    geolocation_meta: { lmode: 'fore', wssid: '', reqssid: '', fence_violation: '' },
    device: {
      battery: String(opts.battery ?? 78),
      charge: '0',
      wifi_state: '1',
      driveSDKStatus: 'OFF',
      userActivity: 'unknown',
      build: '24.24.0.1171',
    },
    flags: { preciseLocation: 'fullAccuracy', clientLowBatteryAlert: false, clientPlaceBreachAlert: false },
  };
  const b64 = Buffer.from(JSON.stringify(ctx)).toString('base64');
  const r = await call('PUT', 'https://iphone.life360.com/v4/locations', {
    token,
    headers: { 'X-Device-ID': deviceId, 'X-UserContext': b64 },
  });
  if (r.status === 200) return true;
  throw new Error(`put ${r.status}: ${r.body?.slice(0, 200)}`);
}

module.exports = { call, login, getUserId, getCircles, getDeviceId, putLocation, BASIC_AUTH };
