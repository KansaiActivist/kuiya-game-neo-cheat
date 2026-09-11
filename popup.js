const statusEl = document.getElementById('status');
const controls = {
  autoJump: document.getElementById('autoJump'),
  invincible: document.getElementById('invincible'),
  noFallDeath: document.getElementById('noFallDeath'),
  speedMultiplier: document.getElementById('speedMultiplier'),
  coinFrequency: document.getElementById('coinFrequency')
};

function readControl(el) {
  if (el.type === 'checkbox') return el.checked;
  return parseFloat(el.value);
}
function writeControl(el, value) {
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = String(value);
}

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || '';
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ページ内で実行される関数(クイヤゲームのフック __KUIYA__ を読み書きする)
function pageGetCheats() {
  if (!window.__KUIYA__ || !window.__KUIYA__.cheats) return null;
  return window.__KUIYA__.cheats;
}
function pageSetCheat(key, value) {
  if (!window.__KUIYA__ || !window.__KUIYA__.cheats) return false;
  window.__KUIYA__.cheats[key] = value;
  return true;
}

async function readCurrentState() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) { setStatus('タブが取得できませんでした。', 'ng'); return; }
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: pageGetCheats
    });
    if (!result) {
      setStatus('このタブではクイヤゲームが見つかりません。ゲームのページを開いてから、もう一度開いてください。', 'ng');
      Object.values(controls).forEach(el => el.disabled = true);
      return;
    }
    Object.values(controls).forEach(el => el.disabled = false);
    Object.entries(controls).forEach(([key, el]) => {
      if (key in result) writeControl(el, result[key]);
    });
    setStatus('クイヤゲームに接続しました。', 'ok');
  } catch (e) {
    setStatus('接続に失敗しました: ' + e.message, 'ng');
  }
}

async function applyCheat(key, value) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: pageSetCheat,
      args: [key, value]
    });
    setStatus(result ? '反映しました。' : 'クイヤゲームが見つかりません。反映されていません。', result ? 'ok' : 'ng');
  } catch (e) {
    setStatus('反映に失敗しました: ' + e.message, 'ng');
  }
}

Object.entries(controls).forEach(([key, el]) => {
  el.addEventListener('change', () => applyCheat(key, readControl(el)));
});

readCurrentState();
