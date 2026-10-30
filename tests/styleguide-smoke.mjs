import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = resolve(root, 'artifacts');
const serverPort = 4176;
const debugPort = 9226;
const baseUrl = `http://127.0.0.1:${serverPort}`;
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((path) => existsSync(path));
assert.ok(chrome, 'Set CHROME_BIN to a Chrome/Chromium executable');

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const children = [];
const exceptions = [];

async function waitFor(check, description, timeout = 10000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeout) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await sleep(60);
  }
  throw new Error(`Timed out: ${description}${lastError ? ` · ${lastError.message}` : ''}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const server = spawn('python3', ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore',
});
children.push(server);
await waitFor(async () => (await fetch(`${baseUrl}/styleguide.html`)).ok, 'styleguide server');

const browser = spawn(chrome, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-crash-restore-bubble',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/fa2-styleguide-chrome-${process.pid}`,
  'about:blank',
], { stdio: 'ignore' });
children.push(browser);

try {
  const targets = await waitFor(() => fetchJson(`http://127.0.0.1:${debugPort}/json/list`), 'Chrome debugger');
  const page = targets.find((target) => target.type === 'page');
  assert.ok(page);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails);
    }
  });

  function cdp(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolveCdp, rejectCdp) => {
      pending.set(id, { resolve: resolveCdp, reject: rejectCdp });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result.value;
  }

  const visible = (selector) => `(() => {
    const elements = [...document.querySelectorAll(${JSON.stringify(selector)})];
    return elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
  })()`;

  async function click(selector) {
    const clicked = await evaluate(`(() => { const element = ${visible(selector)}; if (!element) return false; element.click(); return true; })()`);
    assert.ok(clicked, `Visible element not found: ${selector}`);
    await sleep(50);
  }

  async function count(selector) {
    return evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }).length`);
  }

  await mkdir(artifacts, { recursive: true });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `${baseUrl}/styleguide.html#direction=porcelain&mode=light` });
  await waitFor(() => evaluate(`Boolean(${visible('.sg-hero h1')})`), 'styleguide render');
  assert.equal(await evaluate('document.documentElement.dataset.direction'), 'porcelain');
  assert.equal(await evaluate('document.documentElement.dataset.mode'), 'light');
  assert.equal(await evaluate('document.querySelector(".sg-hero h1").textContent'), 'Porcelain');
  assert.equal(await evaluate('document.querySelector(".sg-back").getAttribute("href")'), 'index.html');
  assert.equal(await count('.sg-seg [data-direction-button]'), 3);
  assert.equal(await count('[data-section]'), 8);

  // Every direction and mode renders all sections without a JS exception.
  for (const direction of ['graphite', 'prism', 'porcelain']) {
    await click(`[data-direction-button="${direction}"]`);
    assert.equal(await evaluate('document.documentElement.dataset.direction'), direction);
    const expectedName = { prism: 'Prism', graphite: 'Graphite', porcelain: 'Porcelain' }[direction];
    assert.equal(await evaluate('document.querySelector(".sg-hero h1").textContent'), expectedName);
    assert.equal(await count('[data-section]'), 8);
    assert.ok(await count('.swatch') >= 21, `${direction} palette swatches`);
    assert.equal(await count('.sg-table .is-bad'), 0, `${direction} WCAG rows`);
    assert.ok(await count('.icon-cell') >= 24, `${direction} inline SVG icon cells`);
    await click('[data-role="mode-toggle"]');
    assert.equal(await evaluate('document.documentElement.dataset.mode'), 'dark');
    assert.equal(await count('.sg-table .is-bad'), 0, `${direction} dark WCAG rows`);
    await click('[data-role="mode-toggle"]');
  }

  // Motion demos replay with the active direction's tokens.
  assert.equal(await count('.demo'), 9);
  assert.equal(await count('.demo__spec'), 9);
  await click('[data-replay="send"]');
  assert.ok(await evaluate('document.querySelector(\'[data-demo="send"]\').classList.contains(\'playing\')'));
  await click('[data-replay="sheet"]');
  assert.ok(await evaluate('document.querySelector(\'[data-demo="sheet"]\').classList.contains(\'playing\')'));

  // Choosing persists and confirms in a toast.
  await click('[data-role="choose"]');
  assert.equal(await evaluate('localStorage.getItem("fa2.styleguide.choice")'), 'porcelain');
  assert.ok(await evaluate(`Boolean(${visible('.sg-toast.is-visible')})`), 'choice toast');

  // Mobile width stays inside the viewport.
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(150);
  const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  assert.ok(overflow <= 1, `mobile horizontal overflow: ${overflow}px`);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(artifacts, 'styleguide-mobile-smoke.png'), Buffer.from(shot.data, 'base64'));

  assert.deepEqual(exceptions, []);
  socket.close();
  console.log('OK: styleguide directions, modes, WCAG, SVG icons, motion replays, mobile width');
} finally {
  for (const child of [...children].reverse()) child.kill('SIGTERM');
}
