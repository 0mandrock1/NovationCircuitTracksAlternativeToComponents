# Novation Circuit Tracks — Web UI

A browser-based alternative to **Novation Components** for the Novation Circuit Tracks synthesizer/sequencer.
Provides a full-featured interface for editing synth patches, managing drum samples, configuring MIDI, editing sequences, and managing sessions — without installing any native app.

HOSTED AT: https://novation-circuit-tracks-alternative.vercel.app
---

## Features

| Tab | MIDI capabilities |
|-----|-------------------|
| **Patches** | Full synth editor (oscillators, filter, envelopes, LFO, FX); macro assignments; modulation matrix; live SysEx update on every knob change (30 ms debounce) |
| **Samples** | Browse, preview, replace and upload drum samples; auto-converted to 48 kHz mono 16-bit via ffmpeg |
| **Sequencer** | Visual step grid for all 8 tracks — velocity, probability, microtiming; real-time step highlight via MIDI clock |
| **Mixer** | Real-time faders (CC), pan, mute/solo, reverb/delay sends; macro knob feedback |
| **MIDI Settings** | CC assignments per macro template, track-channel routing, clock sync options |
| **Sessions** | Project grid (64 slots), pack management, scene list, SysEx export/import |
| **Device** | Connection status, port selection, firmware version; global tempo/swing/transpose (CC best-effort) |

---

## Architecture

```
Browser (Chrome / Edge)
  ├─ Web MIDI API ─────────────────────────────────► Circuit Tracks (USB)
  │    └─ useMidi.js (direct, low-latency CC & SysEx)
  │
  └─ WebSocket ──► Node.js Server ──► easymidi ──► Circuit Tracks (USB)
       /ws          MidiManager.js    node-midi
       (REST /api)  SysExParser.js
                    SysExBuilder.js
```

The frontend uses **two parallel MIDI paths**:
- **Web MIDI API** (`useMidi.js`) — direct browser access, low-latency for CC knobs and playback.
- **Node.js bridge** — handles SysEx reliably (patch dumps, bank transfers), relays events over WebSocket, and serves the REST API for file management.

---

## Requirements

- **Node.js** 18 LTS or newer, **npm** 9+
- **Chrome** or **Edge** (Web MIDI API with SysEx requires a Chromium-based browser)
- Circuit Tracks connected via **USB** to the machine running the server

---

## Quick Start

```bash
# 1. Install all dependencies (root + client + server)
npm run install:all

# 2. Start dev servers  (Vite on :5173, Node.js on :3000)
npm run dev

# 3. Open in Chrome
open http://localhost:5173
```

Connect your Circuit Tracks via USB before or after opening the app — the status bar updates automatically.
On first use, go to the **Device** tab and click **Enable MIDI** to grant browser permission.

---

## MIDI Connection Guide

### USB Setup

1. Connect Circuit Tracks to the computer running the server via USB-B cable.
2. The device appears as two MIDI ports:
   `Circuit Tracks MIDI 1` (USB) — use this for all SysEx.
   `Circuit Tracks MIDI 2` (DIN bridge) — only if you need DIN passthrough.

### Browser Permission

The first time you open the app, Chrome shows a MIDI permission dialog.
Click **Allow** and also tick **Allow sites to use SysEx messages** (required for patch transfers).

### Port Selection

On the **Device** tab:
- Click **Enable MIDI** (once per browser session).
- Select `Circuit Tracks MIDI 1` from the port list and click **Connect**.
- The green status dot confirms the connection.

### Web MIDI vs Server path

| Path | Used for | Latency |
|------|----------|---------|
| Web MIDI (browser direct) | CC knobs, note on/off, macro feedback | ~1–5 ms |
| Node.js bridge (WebSocket) | SysEx patch dumps, bank transfers, clock relay | ~5–20 ms |

Both paths connect to the same USB port. The server path is the authoritative source for patch data.

---

## MIDI Tester

A standalone diagnostic tool is available at:

```
http://localhost:5173/midi-tester.html
```

No build step, no Vue — just open in Chrome.

### Sections

| Section | What it does |
|---------|-------------|
| **Connection** | Enable Web MIDI, list all ports, select IN and OUT independently or together |
| **MIDI IN Monitor** | Scrolling colour-coded log: green = Note On, red = Note Off, blue = CC, orange = SysEx, purple = transport |
| **Send CC** | Send any CC number on any channel |
| **Note On / Off** | Trigger notes manually |
| **NRPN** | Send 14-bit NRPN messages |
| **Transport** | Start / Stop / Continue / single Clock tick |
| **SysEx** | Paste hex bytes (space-separated) and send; validated before sending |
| **Quick Tests** | One-click presets for common Circuit Tracks operations |

### Quick Test presets

| Button | What it sends |
|--------|--------------|
| Request Current Patch — Syn 1 | `F0 00 20 29 01 64 63 00 F7` |
| Request Current Patch — Syn 2 | `F0 00 20 29 01 64 63 01 F7` |
| Filter Cutoff → 64 | CC 74 = 64 on Ch 1 |
| Macros CC80–87 sweep | CC 80–87 = 127 then 0, 50 ms intervals |
| Pan Center all channels | CC 10 = 64 on Ch 1, 2, 6, 7, 8, 9 |
| Reverb Send → 64 | CC 91 = 64 on Ch 1 |
| MIDI Identity Request | `F0 7E 7F 06 01 F7` |
| All Notes Off | CC 123 = 0 on Ch 1–6 |

---

## Global Settings (Device Tab)

The **Tempo**, **Swing**, and **Transpose** controls in the Device tab send MIDI CC to the server, which relays them to the Circuit Tracks:

| Setting | CC # | Range | Notes |
|---------|------|-------|-------|
| Tempo | 0x51 (81) | 40–240 BPM | Approximate — CC resolution is 128 steps |
| Swing | 0x52 (82) | 0–100% | Mapped to 0–127 |
| Transpose | 0x53 (83) | −12 … +12 semitones | Offset from centre (64) |

Click **Apply** after changing a value. The status message confirms success or shows a connection error.

---

## Production Deploy

### 1. Build

```bash
npm run build          # outputs compiled frontend to client/dist/
```

### 2. Run the server

The Express server serves the compiled frontend from `client/dist/` automatically.

```bash
PORT=3000 node server/index.js
```

Open `http://your-host:3000` in Chrome.

### 3. Keep alive with pm2

```bash
npm install -g pm2
pm2 start server/index.js --name circuit-ui
pm2 save
pm2 startup            # follow the printed command to enable on boot
```

### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Add TLS: `certbot --nginx -d your-domain.com`

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP / WebSocket port |

> **Note:** USB MIDI requires a physical connection between Circuit Tracks and the machine running the server. Remote VPS deployments work for the UI and session management, but real-time MIDI requires the server to run locally.

---

## Project Structure

```
/
├── client/                  # Vue 3 app (Vite)
│   ├── public/
│   │   ├── midi-tester.html         # standalone MIDI diagnostic tool
│   │   └── circuit-tracks-midi-cheatsheet.html
│   └── src/
│       ├── views/           # one view per tab
│       ├── components/      # feature components + ui/ primitives
│       ├── stores/          # Pinia: device, patches, samples, sequencer, mixer, midi, sessions
│       └── composables/     # useMidi.js, useWebSocket.js, useToast.js
└── server/                  # Node.js backend
    ├── midi/                # MidiManager, SysExParser, SysExBuilder, constants
    ├── routes/              # Express REST: /api/patches, /api/samples, /api/device, /api/mixer
    └── ws/                  # WebSocketHandler — MIDI events → browser
```

---

## Known Limitations

- **Firmware query not implemented** — the firmware version shown on the Device tab is always "unknown" until a proper SysEx query is implemented.
- **Reverb/delay preset selection** — preset numbers are not remotely configurable via CC or documented SysEx; the UI shows the parameter values only.
- **CC-based tempo is approximate** — MIDI CC has 128 steps, so tempo resolution is ~1.6 BPM per step.
- **Chrome / Edge only** — Web MIDI API with SysEx is not supported in Firefox or Safari. The Node.js bridge works in any browser for patch management, but real-time CC requires Chromium.
- **Single USB connection** — only one browser session should control the device at a time; multiple WebSocket clients will all receive events but simultaneous SysEx writes can race.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow the code conventions in `CLAUDE.md`.
3. When working with MIDI constants, CC numbers, or SysEx formats, consult `circuit-tracks-midi-cheatsheet.html` in the project root.
4. Open a pull request with a clear description.

---

## License

MIT
