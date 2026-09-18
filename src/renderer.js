const box = document.getElementById('statusBox');
const btn = document.getElementById('fetchBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const saveBtn = document.getElementById('saveBtn');
const savedMsg = document.getElementById('savedMsg');

function setStatus(type, msg, file = '') {
  box.className = 'status ' + type;

  let icon = '👋';
  if (type === 'loading') {
    icon = '<div style="width:20px;height:20px;border:2px solid rgba(233,69,96,0.3);border-top-color:#e94560;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px"></div>';
  }
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  box.innerHTML = icon + ' ' + msg + (file ? `<div style="margin-top:4px;font-size:11px;color:#8892b0">${file}</div>` : '');
  btn.disabled = type === 'loading';
  btn.textContent = type === 'loading' ? '⏳ Working...' : '⚡ Fetch Subtitle';
}

btn.addEventListener('click', async () => {
  setStatus('loading', 'Checking VLC & searching...');
  try {
    const res = await window.api.fetchSubtitle();
    // res is now guaranteed to be an object, not undefined
    if (res && res.success) {
      setStatus('success', res.message, res.file || '');
    } else {
      setStatus('error', (res && res.message) || 'Unknown error');
    }
  } catch (err) {
    setStatus('error', err.message || 'Failed');
  }
});

settingsBtn.addEventListener('click', () => {
  const isOpen = settingsPanel.classList.contains('show');
  if (isOpen) {
    settingsPanel.classList.remove('show');
  } else {
    settingsPanel.classList.add('show');
    loadSettings();
  }
});

saveBtn.addEventListener('click', async () => {
  await window.api.saveSettings({
    apiKey: document.getElementById('apiKey').value.trim(),
    lang: document.getElementById('lang').value,
    vlcPass: document.getElementById('vlcPass').value,
    vlcUrl: document.getElementById('vlcUrl').value.trim()
  });

  savedMsg.classList.add('show');

  setTimeout(() => {
    savedMsg.classList.remove('show');
  }, 1500);
});

async function loadSettings() {
  try {
    const s = await window.api.getSettings();
    document.getElementById('apiKey').value = s.apiKey || '';
    document.getElementById('lang').value = s.lang || 'en';
    document.getElementById('vlcPass').value = s.vlcPass || 'vlcpass';
    document.getElementById('vlcUrl').value = s.vlcUrl || 'http://127.0.0.1:8080';
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

window.api.onStatus((data) => {
  setStatus(data.type, data.msg, data.file || '');
});

window.api.onOpenSettings(() => {
  settingsPanel.classList.add('show');
  loadSettings();
});