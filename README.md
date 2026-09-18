# 🎬 VLC Subtitle Fetcher

> One-click subtitle downloader that integrates directly with VLC Media Player.

[![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

- ⚡ **One-click subtitle fetch** — Press `Ctrl + Shift + S` or use the tray menu while watching a movie
- 🔍 **Smart matching** — Searches by file hash first, then falls back to filename search
- 🎯 **Automatic VLC injection** — Downloads the subtitle and loads it directly into VLC
- 📁 **Organized storage** — Saves subtitles to a `subtitles/` folder beside the video
- 🖥️ **System tray app** — Runs quietly in the background and stays ready
- ⚙️ **Settings panel** — Configure your OpenSubtitles API key, language, VLC URL and VLC password
- 💾 **Persistent configuration** — Settings are saved and reused between sessions
- 🌐 **Multi-language support** — Choose your preferred subtitle language
- 🔔 **Desktop notifications** — Get notified when subtitles are successfully loaded or when an error occurs
- 🔒 **Secure Electron architecture** — Uses context isolation and a preload bridge instead of exposing Node.js directly to the renderer

---

## 🛠️ Tech Stack

| Layer                  |              Technology                 |
|     -------            |              -----------                |
| **Desktop Shell**      | [Electron](https://www.electronjs.org/) |
| **HTTP Client**        | [Axios](https://axios-http.com/)        |
| **Subtitle Database**  | [OpenSubtitles API v1](https://www.opensubtitles.com/) |
| **Player Integration** | VLC HTTP Interface                      |
| **Language**           | Node.js / JavaScript                    |

---

## 📦 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [VLC Media Player](https://www.videolan.org/vlc/)
- OpenSubtitles API Key (free)

### 1. Clone or Download

```bash
cd C:\subtitle-fetcher
```

### 2. Install Dependencies

```bash
npm install
```

This installs Electron and Axios.

### 3. Configure VLC HTTP Interface

VLC needs its built-in web API enabled so the app can detect what's playing.

**Option A — Command Line (Recommended for testing):**
```powershell
& "C:\Program Files\VideoLAN\VLC\vlc.exe" --extraintf http --http-password vlcpass
```

**Option B — Permanent Shortcut:**
1. Right-click Desktop → **New → Shortcut**
2. Set target to:
   ```
   "C:\Program Files\VideoLAN\VLC\vlc.exe" --extraintf http --http-password vlcpass
   ```
3. Name it **"VLC + Subtitles"** and use this to launch VLC forever

> **Note:** The password `vlcpass` must match the one in the app's settings.

### 4. Get Your OpenSubtitles API Key

1. Go to [opensubtitles.com/en/consumers](https://www.opensubtitles.com/en/consumers)
2. Register a free account
3. Verify your email
4. Navigate to **API Consumers** → **Create New Consumer**
5. Copy the API key

---

## 🚀 Usage

### Launch the App

```bash
npm start
```

Or double-click the **Desktop Shortcut** you created.

The app will appear as an icon in your **system tray** (bottom-right corner).

### First-Time Setup

1. **Click the tray icon** → **⚙️ Settings**
2. Paste your **OpenSubtitles API Key**
3. Select your **preferred language**
4. Confirm the **VLC password** matches (`vlcpass` by default)
5. Click **Save**

### Fetch a Subtitle

1. **Play any movie** in VLC (launched with HTTP interface)
2. Press **`Ctrl + Shift + S`** anywhere on your PC

   **OR**

   Click the tray icon → **⚡ Fetch Subtitle**

3. The app will:
   - Detect the movie currently playing
   - Compute the file hash
   - Search OpenSubtitles
   - Download the first matching subtitle result returned by OpenSubtitles.
   - Inject it directly into VLC

4. **Done.** The subtitle appears automatically.

### Sync Adjustment

If the subtitle timing is slightly off:

|  VLC Hotkey |               Action                |
| ----------- |              --------               |
|     `G`     | Speed up subtitle (appears earlier) |
|     `H`     | Slow down subtitle (appears later)  |

Or use **VLC → Tools → Track Synchronization** for precise control.

---

## 📁 Project Structure

```
subtitle-fetcher/
│
├── 📄 package.json              # Project config & dependencies
├── 📄 package-lock.json         # Locked dependency versions
├── 📄 index.html                # Electron UI (main window)
├──     README.md               
│
├── 📂 src/
│   ├── main.js                  # Electron main process (tray, hotkeys, IPC)
│   ├── preload.js               # Secure bridge between main & renderer
│   ├── renderer.js              # UI logic & button handlers
│   └── subtitle-engine.js       # Core logic (VLC detection, hash, API calls)
│
├── 📂 assets/
│   └── icon.png                 # Tray icon
│
├── 📄 subtitle-fetcher.js       # Original CLI script (standalone version)
│
├── 📂 node_modules/             # Installed packages
│
└── 📄 debug-*.js                # Development test scripts
    debug-fix.js
    debug-hash.js
    debug-vlc.js
    test-download.js
    test-key.js
```

---

## 🔧 Configuration

Settings are stored automatically in your system's app data folder and persist between sessions.

|  Setting  |         Default         |          Description             |
| --------- |        ---------        |         -------------            |
| `apiKey`  |        *(empty)*        |    Your OpenSubtitles API key    |
|  `lang`   |          `en`           | Preferred subtitle language code |
| `vlcPass` |        `vlcpass`        |   VLC HTTP interface password    |
| `vlcUrl`  | `http://127.0.0.1:8080` |         VLC HTTP endpoint        |

---

## 🐛 Troubleshooting

### "VLC not responding"
- VLC is not running, or the HTTP interface is not enabled
- **Fix:** Launch VLC with `--extraintf http --http-password vlcpass`

### "API key missing"
- You haven't entered your OpenSubtitles API key in Settings
- **Fix:** Click tray icon → Settings → paste your key

### "No subtitles found"
- The movie is too new or obscure
- Your specific video release isn't in the database
- **Fix:** The app falls back to name-based search, but results may vary

### "Download failed: 503"
- OpenSubtitles server is temporarily overloaded
- **Fix:** The app auto-retries. If it persists, wait a minute and try again.

### "Subtitle is out of sync"
- The downloaded subtitle is for a different video release (different cut, FPS, etc.)
- **Fix:** Press `G` or `H` in VLC to adjust timing manually

### Tray icon doesn't appear
- The `assets/icon.png` file is missing or corrupted
- **Fix:** Ensure `assets/icon.png` exists in the project root

---

## 🗺️ Roadmap

- [ ] Auto-detect VLC launch and prompt to enable HTTP interface
- [ ] Manual subtitle search with multiple results picker
- [ ] Subtitle sync offset memory (remember per-movie adjustments)
- [ ] Support for MPV and other players
- [ ] Package as standalone `.exe` installer
- [ ] Auto-start with Windows option

---

## 📝 License

MIT License — feel free to use, modify, and share.

---

## 🙌 Acknowledgments

- [OpenSubtitles](https://www.opensubtitles.com/) for the subtitle database
- [VideoLAN](https://www.videolan.org/) for VLC's HTTP API
- [Electron](https://www.electronjs.org/) for the desktop framework

---

> Built with 💻 by Nico
