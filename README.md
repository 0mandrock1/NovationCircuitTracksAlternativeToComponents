# Novation Circuit Tracks — Web UI

A browser-based alternative to Novation Components for the **Novation Circuit Tracks** synthesizer/sequencer.

Provides a full-featured interface for editing synth patches, managing drum samples, configuring MIDI, editing sequences, and managing sessions — all from a web browser via Web MIDI API or a local Node.js MIDI bridge.

---

## Features

| Tab | Description |
|-----|-------------|
| **Patches** | Full synth editor (oscillators, filter, envelopes, LFO, FX), macro assignments, modulation matrix |
| **Samples** | Browse, preview, replace and upload drum samples (auto-converted to 48 kHz mono 16-bit) |
| **Sequencer** | Visual step grid for all 8 tracks — velocity, probability, microtiming |
| **Mixer** | Real-time faders, pan, mute/solo, reverb/delay sends |
| **MIDI Settings** | MIDI templates, CC assignments, track routing, clock sync |
| **Sessions** | Project grid (64 slots), pack management, scene list, SysEx export/import |
| **Device** | Connection status, port selection, firmware version and update |

---

## Tech Stack

- **Frontend** — Vue 3, Vite, Pinia, Vue Router
- **Backend** — Node.js, Express, ws (WebSocket), easymidi (optional MIDI bridge)
- **MIDI** — SysEx over USB via Web MIDI API (Chrome) or the Node.js bridge

---

## Requirements

- **Node.js** 18 LTS or newer
- **npm** 9+
- For USB MIDI: Chrome / Chromium browser (Web MIDI API), or the Node.js server on the same machine as the device

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/your-org/novation-circuit-tracks-ui.git
cd novation-circuit-tracks-ui

# 2. Install all dependencies (root + client + server)
npm run install:all

# 3. Start dev servers (client on :5173, backend on :3000)
npm run dev
```

Open **http://localhost:5173** in Chrome.
Connect your Circuit Tracks via USB before or after opening the app — the status bar shows the connection state.

---

## Production Build & Self-Hosted Deploy

### 1. Build the frontend

```bash
npm run build          # outputs to client/dist/
```

### 2. Start the server

The Express server automatically serves the compiled frontend from `client/dist/`.

```bash
# Set the port (default: 3000)
PORT=3000 node server/index.js
```

Open **http://your-host:3000** in a browser.

### 3. Keep it running (pm2)

```bash
npm install -g pm2
pm2 start server/index.js --name circuit-ui
pm2 save
pm2 startup          # follow the printed command to enable on boot
```

### 4. Reverse proxy (nginx example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Add TLS with `certbot --nginx -d your-domain.com` (Let's Encrypt).

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP / WebSocket port |

> **Note on USB MIDI:** USB MIDI requires a physical connection between the Circuit Tracks and the machine running the server. Remote VPS deployments work for the UI and session management, but real-time MIDI control requires the server to run locally (or on a machine with USB access).

---

## Project Structure

```
/
├── client/          # Vue 3 app (Vite)
│   └── src/
│       ├── views/       # one per tab
│       ├── components/  # reusable UI + feature components
│       └── stores/      # Pinia stores
└── server/          # Node.js backend
    ├── midi/        # MidiManager, SysEx parser/builder, constants
    ├── routes/      # Express REST routes
    └── ws/          # WebSocket handler
```

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow the code conventions in `CLAUDE.md`.
3. Open a pull request with a clear description.

---

## License

MIT
