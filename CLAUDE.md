# CLAUDE.md

## Project Overview

This project is a web-based UI alternative to the default component interface for the **Novation Circuit Tracks** groovebox. It is built with **Node.js** and **Vue.js**, providing a richer, more customizable interface for working with the Circuit Tracks device.

## Tech Stack

- **Runtime**: Node.js
- **Frontend Framework**: Vue.js (Vue 3)
- **Package Manager**: npm

## Project Structure (Planned)

```
/
├── CLAUDE.md
├── README.md
├── LICENSE
├── package.json
├── vite.config.js          # or vue.config.js
├── src/
│   ├── main.js             # App entry point
│   ├── App.vue             # Root component
│   ├── components/         # Reusable UI components
│   ├── views/              # Page-level views
│   ├── stores/             # State management (Pinia)
│   └── assets/             # Static assets (styles, images)
├── public/                 # Static public files
└── server/                 # Node.js backend (MIDI/WebSocket bridge)
    └── index.js
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Notes

- The Vue frontend communicates with a Node.js backend that bridges MIDI I/O with the browser via WebSockets.
- The Node.js server handles MIDI communication with the Novation Circuit Tracks device using the Web MIDI API or a native MIDI library (e.g., `easymidi` or `midi`).
- State management uses **Pinia** (the Vue 3 standard store).
- Component styling uses scoped `<style>` blocks within `.vue` files.

## Novation Circuit Tracks Context

The Novation Circuit Tracks is a groovebox with:
- 2 synth tracks
- 4 MIDI tracks
- 8 drum tracks
- 32-step sequencer per track
- Macro controls, patterns, and scenes

The UI aims to replicate and extend the physical interface — providing step sequencer editing, patch browsing, and MIDI routing in the browser.

## Coding Guidelines

- Use **Vue 3 Composition API** (`<script setup>`) for all components.
- Keep components small and focused — one responsibility per component.
- Use **Pinia** for shared state (tracks, steps, patterns, MIDI state).
- MIDI communication logic lives in the `server/` directory, not in Vue components.
- Prefer named exports over default exports in plain JS/TS modules.
- Use `kebab-case` for component file names and `PascalCase` when importing them in Vue.
