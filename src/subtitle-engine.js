const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const os = require('os');

// Store settings in home dir so it works in both Electron and CLI
const SETTINGS_PATH = path.join(os.homedir(), '.subtitle-fetcher-settings.json');

function getSettings() {
  const defaults = {
    vlcPass: 'vlcpass',
    vlcUrl: 'http://127.0.0.1:8080',
    apiKey: '',
    lang: 'en'
  };

  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const saved = JSON.parse(
        fs.readFileSync(SETTINGS_PATH, 'utf8')
      );

      return {
        ...defaults,
        ...saved
      };
    }
  } catch (e) {
    console.error('Error reading settings:', e.message);
  }

  return defaults;
}

function saveSettings(s) {
  const current = getSettings();

  const updated = {
    ...current,
    ...s
  };

  fs.writeFileSync(
    SETTINGS_PATH,
    JSON.stringify(updated, null, 2)
  );
}

async function getVLCFile(settings) {
  const res = await axios.get(`${settings.vlcUrl}/requests/playlist.json`, {
    auth: { username: '', password: settings.vlcPass },
    timeout: 5000
  });

  const find = (items) => {
    for (const item of items) {
      if (item.current === 'current' && item.uri && item.uri.startsWith('file://')) {
        return decodeURIComponent(item.uri.replace('file:///', '').replace('file://', ''));
      }
      if (item.children) {
        const found = find(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return res.data.children ? find(res.data.children) : null;
}

async function injectSubtitle(srtPath, settings) {
  const url = 'file:///' + srtPath.replace(/\\/g, '/').replace(/ /g, '%20');
  await axios.get(`${settings.vlcUrl}/requests/status.json`, {
    auth: { username: '', password: settings.vlcPass },
    params: { command: 'add', input: url },
    timeout: 5000
  });
}

function computeHash(filePath) {
  const size = fs.statSync(filePath).size;
  const chunk = 65536;
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(chunk);
  const tail = Buffer.alloc(chunk);
  fs.readSync(fd, head, 0, chunk, 0);
  fs.readSync(fd, tail, 0, chunk, Math.max(0, size - chunk));
  fs.closeSync(fd);
  const sizeBuf = Buffer.alloc(8);
  sizeBuf.writeBigUInt64LE(BigInt(size), 0);
  return crypto.createHash('md5').update(Buffer.concat([head, tail, sizeBuf])).digest('hex');
}

async function searchOS(params, settings) {
  const res = await axios.get('https://api.opensubtitles.com/api/v1/subtitles', {
    headers: {
      'Api-Key': settings.apiKey,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    params: { ...params, languages: settings.lang },
    timeout: 10000
  });
  return res.data.data && res.data.data.length > 0 ? res.data.data[0] : null;
}

async function downloadOS(fileId, savePath, settings) {
  const getLink = async () => {
    const res = await axios.post('https://api.opensubtitles.com/api/v1/download',
      { file_id: fileId },
      {
        headers: {
          'Api-Key': settings.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      }
    );
    return res.data.link;
  };

  const url = await getLink();
  const file = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 20000
  });
  fs.writeFileSync(savePath, file.data);
}

async function fetchSubtitle() {
  const settings = getSettings();
  if (!settings.apiKey) {
    throw new Error('API key missing. Open Settings first.');
  }

  const videoPath = await getVLCFile(settings);
  if (!videoPath) {
    throw new Error('No video playing in VLC. Is HTTP interface enabled?');
  }
  if (!fs.existsSync(videoPath)) {
    throw new Error('Video file not found.');
  }

  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  const dir = path.dirname(videoPath);
  const subDir = path.join(dir, 'subtitles');
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir);
  const srtPath = path.join(subDir, `${base}.srt`);

  if (fs.existsSync(srtPath)) {
    await injectSubtitle(srtPath, settings);
    return { success: true, message: 'Subtitle loaded!', file: path.basename(srtPath) };
  }

  const hash = computeHash(videoPath);
  let sub = await searchOS({ moviehash: hash }, settings);

  if (!sub) {
    const query = base.replace(/[._]/g, ' ').replace(/\d{4}p.*$/i, '').trim();
    sub = await searchOS({ query }, settings);
  }

  if (!sub) {
    throw new Error('No subtitles found.');
  }

  const fileId = sub.attributes.files[0].file_id;
  await downloadOS(fileId, srtPath, settings);
  await injectSubtitle(srtPath, settings);

  return {
    success: true,
    message: 'Subtitle downloaded & loaded!',
    file: path.basename(srtPath),
    release: sub.attributes.release
  };
}

module.exports = { fetchSubtitle, getSettings, saveSettings };