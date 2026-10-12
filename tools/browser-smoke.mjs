import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// Node 24 and an installed Chrome are required; this script never downloads them.
// CDP: https://chromedevtools.github.io/devtools-protocol/tot/{Input,Runtime,Target}/
const root = fileURLToPath(new URL('../', import.meta.url));
const controller = new AbortController();
const { signal } = controller;

async function until(check, label, milliseconds = 10_000) {
  const end = Date.now() + milliseconds;
  while (Date.now() < end) {
    signal.throwIfAborted();
    const value = await check();
    if (value) return value;
    await delay(50, undefined, { signal });
  }
  throw new Error(`Timed out: ${label}`);
}

async function chromeExecutable() {
  const name = process.env.CHROME_BIN || 'google-chrome';
  const candidates = name.includes('/') ? [name]
    : (process.env.PATH || '').split(delimiter).map(directory => join(directory, name));
  for (const candidate of candidates) {
    try { await access(candidate, constants.X_OK); return candidate; } catch {}
  }
  throw new Error(`Chrome executable not found: ${name}. Set CHROME_BIN to an installed Chrome; no browser smoke tests ran.`);
}

function connect(socket, exceptions) {
  let nextId = 0;
  const pending = new Map();
  const rejectAll = error => {
    for (const request of pending.values()) request.reject(error);
  };
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (message.error) request?.reject(new Error(JSON.stringify(message.error)));
      else request?.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      exceptions.push(details.exception?.description || details.text);
    } else if (message.method === 'Target.targetCrashed') {
      controller.abort(new Error('Chrome page crashed'));
    }
  });
  socket.addEventListener('close', () => rejectAll(new Error('Chrome DevTools connection closed')));
  socket.addEventListener('error', () => rejectAll(new Error('Chrome DevTools connection failed')));
  signal.addEventListener('abort', () => rejectAll(signal.reason), { once: true });
  return (method, params = {}, sessionId) => {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const finish = (callback, result) => {
        clearTimeout(timer);
        pending.delete(id);
        callback(result);
      };
      const timer = setTimeout(() => finish(reject, new Error(`CDP timeout: ${method}`)), 5_000);
      pending.set(id, {
        resolve: result => finish(resolve, result),
        reject: error => finish(reject, error),
      });
      try { socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
      catch (error) { finish(reject, error); }
    });
  };
}

async function pageTools(call, origin, mobile = false) {
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => call(method, params, sessionId);
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: mobile ? 390 : 1280, height: mobile ? 844 : 900,
    deviceScaleFactor: 1, mobile,
  });
  const evaluate = async expression => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, timeout: 4_000,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  };
  await send('Page.navigate', { url: origin });
  await until(async () => {
    try {
      return await evaluate(`location.origin === ${JSON.stringify(origin)} && document.readyState === 'complete' && typeof gameState !== 'undefined'`);
    } catch (error) {
      if (/Cannot find context|context was destroyed/i.test(error.message)) return false;
      throw error;
    }
  }, 'game page load');
  await call('Target.activateTarget', { targetId });
  const check = async (expression, label) => assert.equal(await evaluate(expression), true, label);
  // Native CDP mouse presses also exercise the mobile viewport's virtual buttons.
  const click = async selector => {
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error('Missing control: ' + ${JSON.stringify(selector)});
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) throw new Error('Hidden control: ' + ${JSON.stringify(selector)});
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  const enterGuess = async guess => {
    for (const digit of guess) await send('Input.insertText', { text: digit });
    await check("document.activeElement === [...document.querySelectorAll('.pin-input')].at(-1)", 'final input retains native focus');
    const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
  };
  const snapshot = () => evaluate(`({ attempts: gameState.attempts, active: gameState.isActive,
    gameHidden: document.getElementById('game').classList.contains('hidden'),
    result: document.getElementById('gameOverConsole').textContent,
    history: document.getElementById('console').textContent })`);
  const lateSubmit = async guess => {
    // Only this deliberate late callback is synthetic: hidden controls cannot be clicked.
    await evaluate(`document.querySelectorAll('.pin-input').forEach((input, index) => { input.value = ${JSON.stringify(guess)}[index]; });
      document.getElementById('guessForm').dispatchEvent(new Event('submit', { cancelable: true }));`);
  };
  const start = async () => {
    await click('#btnEasy');
    await click('#confirmLevelBtn');
    await click('#startLevelBtn');
    await check("gameState.isActive && document.querySelectorAll('.pin-input').length === 4", 'free-play starts');
    return evaluate('gameState.secretCode');
  };
  return { check, click, evaluate, enterGuess, snapshot, lateSubmit, start,
    close: () => call('Target.closeTarget', { targetId }) };
}

async function scenarios(call, origin) {
  for (const won of [true, false]) {
    const page = await pageTools(call, origin);
    const secret = await page.start();
    const wrong = secret === '4567' ? '0123' : '4567';
    for (let attempt = 1; attempt <= 6; attempt++) {
      await page.enterGuess(wrong);
      await page.check(`gameState.attempts === ${attempt} && gameState.isActive`, `desktop Enter submits attempt ${attempt}`);
    }
    await page.enterGuess(won ? secret : wrong);
    const expected = won ? 'CODICE DECIFRATO' : 'TENTATIVI ESAURITI';
    await page.check(`gameState.attempts === 7 && !gameState.isActive && document.getElementById('gameOverConsole').firstElementChild.textContent === ${JSON.stringify(expected)}`, `seventh-turn ${won ? 'victory' : 'defeat'}`);
    const before = await page.snapshot();
    await page.lateSubmit(won ? wrong : secret);
    assert.deepEqual(await page.snapshot(), before, 'post-terminal submit leaves outcome and history unchanged');
    await page.close();
    console.log(`PASS native desktop Enter, seventh-turn ${won ? 'victory' : 'defeat'}, terminal guard`);
  }

  const campaign = await pageTools(call, origin);
  await campaign.click('#btnDifficult');
  await campaign.click('.slider-tick[data-value="2"]');
  await campaign.click('#campaignModeBtn');
  await campaign.click('#levelGrid .level-card');
  await campaign.click('#backToMenuBtn');
  await campaign.click('#backFromCampaignBtn');
  await campaign.check(`gameState.difficulty === 'difficult' && gameState.codeLength === 7 &&
    gameState.difficultyMultiplier === 3 && !gameState.campaignMode && gameState.currentCampaignLevel === null &&
    document.getElementById('btnDifficult').classList.contains('selected') && document.getElementById('codeLengthSlider').value === '2'`, 'campaign restores visible and actual free-play settings');
  await campaign.click('#confirmLevelBtn');
  await campaign.click('#startLevelBtn');
  await campaign.check("gameState.isActive && gameState.difficulty === 'difficult' && document.querySelectorAll('.pin-input').length === 7", 'restored free-play starts with seven inputs');
  await campaign.close();
  console.log('PASS campaign to free-play settings');

  const mobile = await pageTools(call, origin, true);
  const secret = await mobile.start();
  const guess = secret === '4567' ? '0123' : '4567';
  await mobile.check(`matchMedia('(max-width: 768px)').matches &&
    [...document.querySelectorAll('.pin-input')].every(input => input.readOnly) &&
    getComputedStyle(document.getElementById('virtualKeyboard')).display !== 'none'`, 'mobile inputs and virtual keyboard are visible');
  for (const digit of guess) await mobile.click(`.vk-key[data-key="${digit}"]`);
  await mobile.check(`[...document.querySelectorAll('.pin-input')].map(input => input.value).join('') === ${JSON.stringify(guess)}`, 'virtual digits reach real inputs');
  await mobile.click('.vk-key[data-key="backspace"]');
  await mobile.check("document.querySelectorAll('.pin-input')[3].value === ''", 'virtual backspace removes the last digit');
  await mobile.click(`.vk-key[data-key="${guess.at(-1)}"]`);
  await mobile.click('.vk-key[data-key="submit"]');
  await mobile.check('gameState.attempts === 1 && gameState.isActive', 'virtual submit consumes one attempt');
  await mobile.close();
  console.log('PASS mobile viewport virtual keyboard with native CDP mouse presses');
}

async function main() {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Node 24 or newer is required');
  const executable = await chromeExecutable();
  const deadline = setTimeout(() => controller.abort(new Error('Browser smoke exceeded 60 seconds')), 60_000);
  let profile, server, chrome, socket;
  let stderr = '';
  try {
    profile = await mkdtemp(join(tmpdir(), 'crack-the-code-smoke-'));
    const types = { '/index.html': 'text/html', '/script.js': 'text/javascript', '/data.js': 'text/javascript',
      '/style.css': 'text/css', '/favicon.png': 'image/png', '/crack-the-code.webp': 'image/webp' };
    server = createServer(async (request, response) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const asset = pathname === '/' ? '/index.html' : pathname;
      if (!types[asset]) { response.writeHead(404).end(); return; }
      try {
        const body = await readFile(join(root, asset.slice(1)));
        response.writeHead(200, { 'Content-Type': types[asset] }).end(body);
      } catch { response.writeHead(404).end(); }
    });
    server.requestTimeout = 3_000;
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    chrome = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
      '--disable-background-networking', '--no-first-run', '--no-default-browser-check',
      '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
      `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], detached: true });
    let launchError;
    chrome.on('error', error => { launchError = error; });
    chrome.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-8_000); });
    const endpoint = await until(async () => {
      if (launchError) throw launchError;
      if (chrome.exitCode !== null || chrome.signalCode !== null) throw new Error(`Chrome exited before startup: ${stderr}`);
      try {
        const [port, path] = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
        return port && path ? `ws://127.0.0.1:${port}${path}` : false;
      } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    }, 'Chrome startup', 15_000);
    const exceptions = [];
    socket = new WebSocket(endpoint);
    const call = connect(socket, exceptions);
    await until(() => {
      if (socket.readyState >= WebSocket.CLOSING) throw new Error('Chrome DevTools connection failed');
      return socket.readyState === WebSocket.OPEN;
    }, 'Chrome DevTools connection', 5_000);
    const version = await call('Browser.getVersion');
    console.log(`Browser smoke: ${version.product}, localhost only`);
    await scenarios(call, origin);
    assert.deepEqual(exceptions, [], 'no uncaught browser exceptions');
    console.log('Browser smoke passed.');
  } catch (error) {
    if (stderr) console.error(`Chrome stderr (tail):\n${stderr}`);
    throw error;
  } finally {
    clearTimeout(deadline);
    socket?.close();
    if (chrome?.pid) {
      try { process.kill(-chrome.pid, 'SIGTERM'); } catch {}
      for (let wait = 0; chrome.exitCode === null && chrome.signalCode === null && wait < 20; wait++) await delay(50);
      try { process.kill(-chrome.pid, 'SIGKILL'); } catch {}
    }
    if (server?.listening) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
  }
}

main().catch(error => { console.error(`Browser smoke FAILED: ${error.message}`); process.exitCode = 1; });
