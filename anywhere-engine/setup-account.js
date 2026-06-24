#!/usr/bin/env node
// One-time per account: discover the userId + circles + the device-id Life360
// will accept for your location pushes, and print a ready accounts.json entry.
//
// Robust path (recommended — sidesteps the login captcha/Cloudflare):
//   1. Log into https://app.life360.com in a browser.
//   2. DevTools > Network > any request to life360.com > copy the
//      Authorization: Bearer <token> value.
//   3. node setup-account.js --token <bearer> --label "Santi" --id a_santi
//
// Fragile path (may hit Cloudflare 403 / fail on 2FA-verified accounts):
//   node setup-account.js --user you@email.com --pass 'secret' --label "Santi" --id a_santi
const l360 = require('./l360');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

(async () => {
  const label = arg('label') || 'Account';
  const id = arg('id') || `a_${Date.now()}`;
  let token = arg('token');

  try {
    if (!token) {
      const user = arg('user');
      const pass = arg('pass');
      if (!user || !pass) {
        console.error('Provide --token <bearer>  OR  --user <email> --pass <pw>');
        process.exit(1);
      }
      console.error('Logging in (may hit Cloudflare — if so use --token instead)...');
      token = await l360.login(user, pass);
      console.error('Got token.');
    }

    const userId = await l360.getUserId(token);
    console.error(`userId: ${userId}`);

    const circles = await l360.getCircles(token);
    if (!circles.length) throw new Error('no circles on this account');

    let found = null;
    for (const c of circles) {
      const { deviceId, status } = await l360.getDeviceId(token, c.id, userId);
      console.error(`  circle "${c.name}" (${c.id}) -> device ${deviceId || `none (status ${status})`}`);
      if (deviceId && !found) found = { deviceId, circle: c.name };
    }
    if (!found) throw new Error('no device registered to this user in any circle — open Life360 on a phone once so a device exists');

    const entry = { id, label, token, deviceId: found.deviceId };
    console.error(`\n✅ Add this to accounts.json (device from circle "${found.circle}"):\n`);
    console.log(JSON.stringify(entry, null, 2));
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
})();
