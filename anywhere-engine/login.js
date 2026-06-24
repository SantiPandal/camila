// Screen-aware Life360 login automation over adb.
// Life360 dropped email/password → passwordless OTP. We drive the native login UI:
//   launch → (logged-out modal) → Sign in → Sign in with email → type email →
//   Continue → [OTP emailed] → type 6-digit code → "Keep using this device" →
//   dismiss Gold upsells → dismiss notifications → MAP.
// Detection is by resource-id / visible text (not blind coordinates), so it tolerates
// the conditional upsell/permission screens. Validated live 2026-06-23.
const { execFile } = require('child_process');

const SDK = process.env.ANDROID_SDK_ROOT || '/opt/homebrew/share/android-commandlinetools';
const ADB = process.env.ADB || `${SDK}/platform-tools/adb`;
const PKG = 'com.life360.android.safetymapd';
const LAUNCH_ACT = `${PKG}/com.life360.koko.LauncherNormal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const adb = (serial, args, timeout = 15000) =>
  new Promise((resolve, reject) =>
    execFile(ADB, ['-s', serial, ...args], { timeout }, (e, out, err) =>
      e ? reject(new Error((err || e.message).trim())) : resolve(out),
    ),
  );

async function dumpUI(serial) {
  await adb(serial, ['shell', 'uiautomator', 'dump', '/sdcard/ui.xml']).catch(() => {});
  return adb(serial, ['shell', 'cat', '/sdcard/ui.xml']).catch(() => '');
}

// --- tiny XML node helpers ---
const nodesOf = (xml) => xml.match(/<node\b[^>]*>/g) || [];
const attr = (node, name) => {
  const m = node.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : '';
};
function center(node) {
  const m = attr(node, 'bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  return { x: (+m[1] + +m[3]) >> 1, y: (+m[2] + +m[4]) >> 1 };
}
function byRid(xml, ridSuffix) {
  for (const n of nodesOf(xml)) if (attr(n, 'resource-id').endsWith(ridSuffix)) return center(n);
  return null;
}
function byText(xml, text, contains = false) {
  for (const n of nodesOf(xml)) {
    const t = attr(n, 'text');
    if (contains ? t.includes(text) : t === text) return center(n);
  }
  return null;
}
const hasText = (xml, t) => nodesOf(xml).some((n) => attr(n, 'text').includes(t));
const mapVisible = (xml) => hasText(xml, 'Membership') && (hasText(xml, 'Driving') || hasText(xml, 'Safety'));
function firstEditText(xml) {
  let best = null;
  for (const n of nodesOf(xml)) {
    if (attr(n, 'class').endsWith('EditText')) {
      const c = center(n);
      if (c && (!best || c.x < best.x)) best = c;
    }
  }
  return best;
}

const tap = (serial, p) => adb(serial, ['shell', 'input', 'tap', String(p.x), String(p.y)]);
const typeText = (serial, t) => adb(serial, ['shell', 'input', 'text', String(t)]);
const back = (serial) => adb(serial, ['shell', 'input', 'keyevent', 'KEYCODE_BACK']);

async function launch(serial) {
  await adb(serial, ['shell', 'am', 'start', '-n', LAUNCH_ACT]).catch(() => {});
  await sleep(4000);
}

// Drive from wherever the app is to the OTP-code screen (or report already logged in).
// Returns 'awaiting_code' | 'logged_in'.
async function driveToCode(serial, email) {
  await launch(serial);
  for (let i = 0; i < 30; i++) {
    const xml = await dumpUI(serial);
    if (hasText(xml, 'Enter the code sent')) return 'awaiting_code';
    if (mapVisible(xml)) return 'logged_in';

    let c;
    if (hasText(xml, "You've been logged out") && (c = byText(xml, 'OK'))) await tap(serial, c);
    else if ((c = byRid(xml, 'email_edit_text'))) {
      // email entry screen: fill + continue
      await tap(serial, c);
      await sleep(500);
      await typeText(serial, email);
      await sleep(600);
      const cont = byRid(await dumpUI(serial), 'continue_button');
      if (cont) await tap(serial, cont);
    } else if ((c = byRid(xml, 'sign_in_email_text'))) {
      await tap(serial, c); // phone screen → switch to email
    } else if ((c = byText(xml, 'Already have an account? Sign in'))) {
      await tap(serial, c);
    } else if (byRid(xml, 'phoneEdt') && (c = byRid(xml, 'sign_in_email_text'))) {
      await tap(serial, c);
    }
    await sleep(2500);
  }
  throw new Error('could not reach the code screen');
}

// Type the OTP and clear the post-login screens until the map. Returns 'logged_in'.
async function submitCode(serial, code) {
  let xml = await dumpUI(serial);
  if (mapVisible(xml)) return 'logged_in';
  if (!hasText(xml, 'Enter the code sent')) throw new Error('not on the code screen');

  const field = firstEditText(xml) || { x: 225, y: 665 };
  await tap(serial, field);
  await sleep(400);
  await typeText(serial, String(code).replace(/\D/g, ''));
  await sleep(3000);

  let stuck = 0;
  for (let i = 0; i < 20; i++) {
    xml = await dumpUI(serial);
    if (mapVisible(xml)) return 'logged_in';
    let c;
    if (hasText(xml, 'incorrect') || hasText(xml, 'invalid') || hasText(xml, "didn't match"))
      throw new Error('the code was incorrect');
    if ((c = byText(xml, 'Keep using this device'))) await tap(serial, c);
    else if ((c = byText(xml, 'No thanks'))) await tap(serial, c);
    else if ((c = byText(xml, 'Maybe Later'))) await tap(serial, c);
    else if (hasText(xml, 'Allow Notifications')) await back(serial);
    else if (hasText(xml, 'Enter the code sent')) {
      // auto-submit didn't fire — nudge the Continue button, then bail if persistent
      const cont = byRid(xml, 'continueBtn');
      if (cont) await tap(serial, cont);
      if (++stuck > 3) throw new Error('code not accepted (check the digits / it may have expired)');
    }
    await sleep(2500);
  }
  throw new Error('login did not reach the map');
}

// Quick state probe: launch + read screen. 'logged_in' | 'logged_out' | 'awaiting_code'.
async function probe(serial) {
  await launch(serial);
  const xml = await dumpUI(serial);
  if (mapVisible(xml)) return 'logged_in';
  if (hasText(xml, 'Enter the code sent')) return 'awaiting_code';
  return 'logged_out';
}

module.exports = { driveToCode, submitCode, probe };
