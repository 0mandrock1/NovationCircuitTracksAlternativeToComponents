---
name: Codebase Documentation by Tab
description: Per-tab breakdown of all components, stores, routes, and data flow for Patches, Samples, Sequencer, Mixer, MIDI, Sessions, Device
type: project
---

# Codebase Documentation by Tab

## Patches

**Route:** `/patches`

**View:** `client/src/views/PatchesView.vue` — Two-column layout: collapsible sidebar with PatchList, main area with sub-tab navigation (Synth / Macros / Effects / Modulation), toolbar with Fetch All / Send All / Export / Import, progress bar during bulk operations, MiniKeyboard at bottom. Sub-tab state is local `ref('synth')`. Sidebar becomes a slide-in drawer on screens narrower than 1024px.

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `patches/PatchList.vue` | 64-item list for the active track's bank; inline rename, per-item hover actions (audition, write, export, rename, delete) | no props; reads `store.patches[store.activeTrack]`, `store.activePatchIndex` |
| `patches/SynthEditor.vue` | OSC A/B, Filter, Filter Env, Amp Env, Amp, LFO 1/2, FX Sends — all editable via Knob/Toggle controls | `patch: Object (required)`, `patchIndex: Number (required)` |
| `patches/MacroEditor.vue` | 8 Macro knobs (CC 80–87 stored inside patch params, not live CC) | `patch: Object (required)`, `patchIndex: Number (required)` |
| `patches/EffectsEditor.vue` | Distortion (enable+amount+type via NRPN), Chorus (enable+params+type via NRPN), Delay preset picker (display-only), Reverb preset picker (display-only), FX Sends knobs | `patch: Object (required)`, `patchIndex: Number (required)` |
| `patches/ModMatrix.vue` | 20-slot modulation matrix table; source/destination dropdowns, depth slider | `patch: Object (required)`, `patchIndex: Number (required)` |
| `ui/MiniKeyboard.vue` | On-screen MIDI keyboard for auditioning patches; sends NoteOn/Off directly via `useMidi` | (not read in detail — present in view) |

**Store:** `stores/patches.js`

State:
- `patches` — `ref({ 0: Array[64], 1: Array[64] })` — two banks (Synth 1 / Synth 2), each slot: `{ index, name, hasData, params, rawBytes }`
- `activeTrack` — `ref(0)` — 0 = Synth 1, 1 = Synth 2
- `activePatchIndex` — `ref(0)`
- `activePatch` — computed from `patches[activeTrack][activePatchIndex]`
- `fetchingAll` / `sendingAll` — `ref(false)` — bulk operation flags
- `fetchProgress` / `sendProgress` — `ref({ done, total:64, failed })` — progress tracking
- `error` — `ref(null)`
- `_cancelFetch` / `_cancelSend` — module-level booleans for cancellation
- `_sendTimer` — debounce timer for `updateParam`

Actions:
- `fetchFromDevice(index, timeout)` — sends `buildRequestPatchDump(index, synthTrack)` via `sendSysExAndWait`, awaits `CMD_PATCH_DUMP` response, calls `parseSysEx`, populates slot
- `fetchAllFromDevice()` — loops 0–63 calling `fetchFromDevice`, 20ms delay between each, honours `_cancelFetch`
- `cancelFetchAll()` — sets `_cancelFetch = true`
- `fetchCurrentPatch()` — sends `buildRequestCurrentPatch`, awaits `CMD_CURRENT_PATCH_DUMP`
- `updateParam(partialParams)` — merges partial into `slot.params`, calls `paramsToBytesPartial`, schedules debounced (30ms) `buildReplaceCurrentPatch` SysEx send
- `sendToDevice(index)` — sets `activePatchIndex`, sends `buildReplaceCurrentPatch` (audition, no bank write)
- `writeToDevice(index)` — sends `buildWritePatch` (writes to device bank slot)
- `sendAllToDevice()` — loops 0–63 calling `buildWritePatch` for all slots with rawBytes, 20ms inter-message delay
- `cancelSendAll()` — sets `_cancelSend = true`
- `exportPatchSyx(index)` — builds `buildPatchDumpMessage`, triggers browser download
- `exportBankSyx()` — builds `buildBankSyx`, triggers browser download
- `importSyx(file)` — reads ArrayBuffer, calls `parseSyxFile`, populates slots
- `renamePatch(index, name)` — mutates slot.name in memory only (no server/device call)
- `deletePatch(index)` — resets slot to `_emptySlot`
- `handleWsPatchUpdate(msg)` — called by WebSocket dispatch to update a single slot
- `handleWsCurrentDump(msg)` — called by WebSocket dispatch to update the active slot

API calls: All patch operations go through Web MIDI directly (`sendSysEx`, `sendSysExAndWait` from `useMidi.js`). No REST calls for patch sync. The REST routes exist server-side but the client store does not call them.

**Server Routes:** `server/routes/patches.js`

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/patches` | Returns array of 64 patch stubs (index, name, hasData) for requested track |
| GET | `/api/patches/export` | Streams full bank as .syx file |
| GET | `/api/patches/:index` | Returns single patch (index, name, params, hasData) |
| GET | `/api/patches/:index/export` | Streams single patch as .syx |
| POST | `/api/patches/:index/send` | Auditions patch on device via server MIDI |
| POST | `/api/patches/:index/write` | Writes patch to device bank slot via server MIDI |
| POST | `/api/patches/:index/fetch` | Requests patch dump from device via server MIDI |
| POST | `/api/patches/fetch-all` | Dumps all 64 patches from device sequentially; stops on first timeout |
| PUT | `/api/patches/:index` | Updates slot name or rawBytes in server in-memory bank |
| DELETE | `/api/patches/:index` | Clears slot in server in-memory bank |
| POST | `/api/patches/import` | Imports .syx (base64-encoded in JSON body) into server bank |

Server stores patches in `banks` object (exported). In-memory only — no disk persistence across server restarts.

**WebSocket events:**
- Incoming (server→client):
  - `patch:update` — `{ type, track, index, name, params, rawBytes }` — broadcast when a `CMD_PATCH_DUMP` SysEx arrives at the server
  - `patch:currentDump` — `{ type, track, params, rawBytes }` — broadcast when `CMD_CURRENT_PATCH_DUMP` arrives

**Data flow summary:** When the client fetches patches, it uses Web MIDI directly (bypassing the server): `useMidi.sendSysExAndWait()` sends `CMD_REQUEST_PATCH_DUMP`, waits for `CMD_PATCH_DUMP` response in `pendingResponses` map, resolves to raw bytes, `parseSysEx` decodes them, `patches` store slot is updated, Vue re-renders. When the device sends an unsolicited SysEx (e.g. user edits on hardware), the server's `WebSocketHandler` receives it and broadcasts `patch:update` or `patch:currentDump` over WebSocket to the browser; `useWebSocket.dispatch` calls `handleWsPatchUpdate` / `handleWsCurrentDump`. Edits in UI call `updateParam` → 30ms debounced `buildReplaceCurrentPatch` → `sendSysEx` direct to device.

**Known issues / TODOs:**
- `renamePatch` and `deletePatch` mutate in-memory store only — there is no server persistence and no SysEx rename command. A rename in the UI will be lost on page reload unless the patch is re-fetched from device.
- `buildRequestPatchDump(index, bank)` — note parameter name: second arg is named `bank` in the builder but the store passes `_synthTrack(activeTrack)` (0x00 or 0x01) as the bank byte. This is correct per spec, but the naming is confusing — it is actually the synth track selector, not a bank number.
- Delay and Reverb preset selectors in `EffectsEditor.vue` are explicitly labelled "Display only" — clicking them sets only local component state; there is no SysEx or CC path to change these presets remotely. This is a hardware limitation but could mislead users.
- NRPN for distortion type uses `NRPN_DISTORTION_TYPE = { msb: 1, lsb: 0 }`, chorus type uses `{ msb: 1, lsb: 24 }`. These are sent direct via `sendNRPN` and are not persisted in `rawBytes`. Closing the Effects sub-tab loses the displayed type selection.
- Server-side `POST /api/patches/fetch-all` stops on first timeout (`break` in catch), which means if a single patch times out the remaining patches are skipped silently.
- `buildWritePatch` on the server passes `_synthSelector(track)` as the `bank` parameter: `buildWritePatch(raw, index, _synthSelector(track))`. But `buildWritePatch(rawBytes, patchIndex, bank = 0)` — the third argument is named `bank`. The Programmer's Reference maps the track selector (0/1) to the bank byte, which is correct, but it is easy to misread.

---

## Samples

**Route:** `/samples`

**View:** `client/src/views/SamplesView.vue` — Simple vertical layout: title, hint text, drop-zone wrapping SampleList. `onMounted` calls `store.loadFromServer()`. Global drag-and-drop handler on the drop-zone assigns files to the first empty slot.

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `samples/SampleList.vue` | Renders 64 `SampleItem` entries from `store.samples` | none |
| `samples/SampleItem.vue` | Single sample row: slot number, name (or rename input), file size, action buttons (play, load, rename, download, send-to-device, delete); drag-drop per slot | `sample: Object (required)`, `index: Number (required)` |

**Store:** `stores/samples.js`

State:
- `samples` — `ref(Array[64])` — each slot: `{ index, name, filename, size, audioUrl, buffer }`
- `loading` — `ref(false)`

Actions:
- `loadFile(index, file)` — reads `ArrayBuffer`, revokes previous `audioUrl`, creates new `Object URL`, updates slot
- `renameSample(index, name)` — updates `slot.name` immediately, then fires `PUT /api/samples/:index/rename` (fire-and-forget, `.catch(() => {})`)
- `deleteSample(index)` — revokes `audioUrl`, resets slot, fires `DELETE /api/samples/:index` (fire-and-forget)
- `exportSample(index)` — downloads from `slot.buffer` as wav blob
- `loadFromServer()` — `GET /api/samples`, populates slots that have a `filename` but no local `audioUrl`

API calls:
- `GET /api/samples` — load initial list from server
- `PUT /api/samples/:index/rename` — persist rename (fire-and-forget)
- `DELETE /api/samples/:index` — persist delete (fire-and-forget)
- `POST /api/samples/:index/upload` — called directly from `SampleItem.vue` and `SamplesView.vue` (not via store)

**Server Routes:** `server/routes/samples.js`

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/samples` | Returns 64-slot `sampleBank` array |
| GET | `/api/samples/:index` | Returns single slot metadata |
| GET | `/api/samples/:index/audio` | Streams audio file with Range support |
| GET | `/api/samples/:index/download` | Streams audio file as attachment |
| PUT | `/api/samples/:index/rename` | Updates name in `sampleBank[index]` |
| POST | `/api/samples/:index/upload` | Accepts WAV/AIFF/MP3 via multer; converts via ffmpeg to 48kHz Mono 16-bit WAV; falls back to original file if ffmpeg unavailable |
| POST | `/api/samples/:index/send` | Always returns `{ ok: false, message: 'Sample SysEx transfer not implemented...' }` — stub |
| DELETE | `/api/samples/:index` | Deletes file from disk, resets `sampleBank` slot |
| PUT | `/api/samples/:index` | Generic slot update (merges req.body) |

Files stored in `server/data/samples/` (created on demand). `sampleBank` is in-memory — names/filenames are lost on server restart unless files persist on disk.

**WebSocket events:** None specific to samples.

**Data flow summary:** Files are loaded locally in browser (Object URLs for immediate preview) and simultaneously uploaded to the server via `POST /api/samples/:index/upload`, which runs ffmpeg conversion. Preview playback uses local Object URL if available, falling back to `/api/samples/:index/audio` server stream for server-side files. Sending samples to the physical device is explicitly not implemented via MIDI — the UI shows an alert directing users to use SD card.

**Known issues / TODOs:**
- `POST /api/samples/:index/send` is a stub that always returns failure. The button exists in `SampleItem.vue` but calls `handleSendToDevice()` which shows a browser `alert()` — the button is misleading.
- Server `sampleBank` is in-memory. On server restart, uploaded files remain on disk but the `sampleBank` array resets to defaults (name = `Sample N+1`, filename = null). The `GET /api/samples` response will not reflect previously uploaded files after restart. There is no disk persistence (no JSON sidecar, no database).
- `SamplesView.vue` drops files directly to `fetch('/api/samples/${slot}/upload', ...)` outside the store, bypassing any store-level error handling.
- The drop handler in `SamplesView.vue` looks for the first slot where `!s.filename`, but after the store loads from server, `filename` may be null even if the slot has a locally loaded file (because `loadFromServer` only sets `filename` if server has one). A slot loaded locally but not yet uploaded will also have `filename: null`, so the drop handler could overwrite it.

---

## Sequencer

**Route:** `/sequencer`

**View:** `client/src/views/SequencerView.vue` — Toolbar with transport controls (Play/Stop/Continue), pattern selector (0–7), step count toggle (16/32), live step indicator. Transport buttons call Web MIDI directly if connected, fall back to `POST /api/transport/{action}`. Delegates rendering to `StepGrid`.

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `sequencer/StepGrid.vue` | Pattern/step-count selector toolbar (duplicates some view toolbar), renders one `TrackRow` per track | none |
| `sequencer/TrackRow.vue` | Single track row: mute button, track name, step cells | `track: Object`, `trackIndex: Number`, `stepCount: Number (default 16)` |
| `sequencer/StepCell.vue` | Single step button: click=toggle, right-click=params popup (velocity, length, probability, microtiming) | `step: Object`, `stepIndex: Number`, `trackIndex: Number`, `isPlaying: Boolean`, `trackColor: String` |

**Store:** `stores/sequencer.js`

State:
- `patterns` — `ref(Array[8])` — 8 patterns, each: `{ stepCount: 16, tracks: Array[10] }` — 10 tracks: Synth 1, Synth 2, MIDI 1–4, Drum 1–4
- `activePatternIndex` — `ref(0)`
- `activePattern` — computed
- `playingStep` — `ref(-1)` — current step highlighted during playback
- `transportState` — `ref('stopped')` — `'stopped' | 'playing' | 'continued'`
- `_activeNotes` — `Map<'ch-note', stepsRemaining>` — internal note-off tracking

Track MIDI channels (0-indexed): `[0, 1, null, null, null, null, 5, 6, 7, 8]` — MIDI 1–4 are null (no MIDI output from browser for those tracks).

Actions:
- `toggleStep(trackIndex, stepIndex)` — toggles `step.active`
- `updateStep(trackIndex, stepIndex, data)` — merges data into step
- `toggleMute(trackIndex)` — toggles track muted flag
- `setPlayingStep(step)` / `setTransportState(state)` — called by WebSocket fallback
- Internal `_triggerStep(stepIdx)` — sends NoteOn for active steps via `sendNoteOn` (calls `useMidi`)
- Internal `_tickNoteOffs()` — decrements note lengths, sends NoteOff when expired
- Internal `_allNotesOff()` — emergency note-off on stop

Event listeners registered at store init:
- `on('transport', ...)` — from `useMidi` — updates `transportState`, resets step/notes on stop
- `on('clock:step', ...)` — from `useMidi` — calls `_tickNoteOffs`, `setPlayingStep`, `_triggerStep`

API calls:
- `POST /api/transport/play` — fallback when Web MIDI not connected
- `POST /api/transport/stop` — fallback + keyboard shortcut handler in `useKeyboard`
- `POST /api/transport/continue` — fallback

**Server Routes:** `server/routes/transport.js`

| Method | Path | What it does |
|--------|------|--------------|
| POST | `/api/transport/play` | Calls `midiManager.sendStart()` — sends MIDI Start (0xFA) |
| POST | `/api/transport/stop` | Calls `midiManager.sendStop()` — sends MIDI Stop (0xFC) |
| POST | `/api/transport/continue` | Calls `midiManager.sendContinue()` — sends MIDI Continue (0xFB) |

**WebSocket events:**
- Incoming (server→client):
  - `sequencer:step` — `{ type, step }` — current clock step (only applied when Web MIDI is not connected)
  - `sequencer:transport` — `{ type, state }` — `'start' | 'stop' | 'continue'` (only applied when Web MIDI is not connected)

**Data flow summary:** When Web MIDI is connected, MIDI Clock ticks (0xF8) drive `_clockTick()` in `useMidi.js` which emits `clock:step` every 6 ticks (= 1/16 note at 24 PPQN). The sequencer store listens on this event, advances `playingStep`, and fires NoteOn/NoteOff via Web MIDI. When Web MIDI is not connected, the server's `MidiManager` receives MIDI clock from the device, broadcasts `sequencer:step` and `sequencer:transport` over WebSocket, and the client store responds to those instead.

**Known issues / TODOs:**
- `StepGrid.vue` has its own pattern selector and step-count controls that duplicate the toolbar in `SequencerView.vue`. Two sets of controls doing the same thing — could confuse users or cause a double-render on interaction.
- Sequencer patterns are purely browser-side state — not persisted to server, not fetched from device. The device's actual patterns are not read or written. The browser sequencer is a standalone MIDI trigger independent of what is in the device's internal memory.
- MIDI 1–4 tracks (`midiCh = null`) silently skip NoteOn/NoteOff in `_triggerStep`. These tracks have step cells in the UI that can be toggled on, but they never produce MIDI output.
- Undo/redo is wired to `Ctrl+Z` in `useKeyboard` but the handler only calls `e.preventDefault()` with no actual undo implementation.
- Step probability is implemented in `_triggerStep` with `Math.random()`, which is per-step-trigger; this is correct behaviour but not synced back to the device's own probability logic.

---

## Mixer

**Route:** `/mixer`

**View:** `client/src/views/MixerView.vue` — Header with "Sync to device" button, horizontal row of 10 `MixerChannel` components, macro knob display section (8 mini bar-graph indicators for Synth 1 CC 80–87).

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `mixer/MixerChannel.vue` | Vertical fader (volume), pan slider, mute/solo buttons, `FxSends` sub-component | `channel: Object (required)`, `index: Number (required)` |
| `mixer/FxSends.vue` | Distortion (CC 91) and Chorus (CC 93) sliders; hidden for MIDI 1–4 tracks (midiCh = null) | `channel: Object`, `index: Number` |

**Store:** `stores/mixer.js`

State:
- `channels` — `ref(Array[10])` — TRACK_DEFS: Synth 1, Synth 2, MIDI 1–4, Drum 1–4; each: `{ name, midiCh, sessionVolCC, volume:100, pan:64, distortion:0, chorus:0, muted:false, soloed:false }`
- `macros` — `ref(Array[8].fill(0))` — current macro knob values

Channel MIDI routing:
- Synth 1: `midiCh=0`, `sessionVolCC=7` (Ch 16)
- Synth 2: `midiCh=1`, `sessionVolCC=8` (Ch 16)
- MIDI 1–4: `midiCh=null`, `sessionVolCC=null`
- Drum 1: `midiCh=5`, `sessionVolCC=9` (Ch 16)
- Drum 2: `midiCh=6`, `sessionVolCC=10` (Ch 16)
- Drum 3: `midiCh=7`, `sessionVolCC=11` (Ch 16)
- Drum 4: `midiCh=8`, `sessionVolCC=12` (Ch 16)

Actions:
- `setVolume(index, value)` — sends `SESSION_CH(15)` + `sessionVolCC` + value; also sends `CC 7` on drum channels only (not synth — per spec)
- `setPan(index, value)` — sends `CC 10` on channel's `midiCh`
- `setDistortion(index, value)` — sends `CC 91` on channel's `midiCh`
- `setChorus(index, value)` — sends `CC 93` on channel's `midiCh`
- `toggleMute(index)` — local state only; no MIDI sent
- `toggleSolo(index)` — local state only; no MIDI sent
- `syncToDevice()` — pushes all volume/pan/distortion/chorus values to device in one pass
- `applyIncomingCC(midiCh, controller, value)` — handles inbound CC: Session Ch 16 → volume, Ch 0-1 CC 80–87 → macros, per-channel CC 7/10/91/93 → respective params
- `_startSync()` / `_stopSync()` — starts/stops 5-second periodic `syncToDevice()` timer; called on `connected` / `disconnected` events from `useMidi`

API calls:
- `POST /api/mixer/cc` — fallback when Web MIDI not connected (sends `{ channel, controller, value }` body)

**Server Routes:** `server/routes/mixer.js`

| Method | Path | What it does |
|--------|------|--------------|
| POST | `/api/mixer/cc` | Calls `midiManager.sendCC(channel, controller, value)` |

**WebSocket events:**
- Incoming (server→client): `midi:cc` — `{ type, channel, controller, value }` — applied to mixer store via `applyIncomingCC` only when Web MIDI is not connected

**Data flow summary:** UI slider changes call `setVolume`/`setPan`/etc. in the store, which calls `sendCC` (direct Web MIDI if connected, else `POST /api/mixer/cc`). When the user turns a physical macro knob, the device sends CC 80–87 on Ch 1 (Synth 1); `useMidi` emits a `cc` event; `applyIncomingCC` updates `macros[i]`. On connect, `_startSync` fires immediately and every 5 seconds to keep device in sync with UI after reconnect or patch change.

**Known issues / TODOs:**
- Mute and Solo are local UI state only. They do not send any MIDI to the device. Circuit Tracks does not support remote mute/solo via MIDI CC, so this is a hardware limitation — but the UI buttons look like they should work.
- `macros` display is labelled "Synth 1 (CC 80–87 / Ch 1)" — Synth 2 macros (Ch 2, also CC 80–87) are silently updated in `applyIncomingCC` (`midiCh === 0 || midiCh === 1`) but the UI only shows one set of 8 bars for Synth 1. Synth 2 macro values are discarded.
- `SESSION_CH = 15` (0-indexed Ch 16) is correct per the spec, but `SESSION_VOL_CC` for Synth 1 is 7 and Synth 2 is 8. This means `CC 7 on Ch 16` = Synth 1 volume. Be careful not to confuse this with `CC 7 on Ch 1` (which is undefined for synths per spec but defined for drums on Ch 6–9).

---

## MIDI Settings

**Route:** `/midi`

**View:** `client/src/views/MidiView.vue` — Vertical stack: `TemplateEditor`, `TrackRouting`, Clock Sync card (3 checkboxes), DIN/USB Ports card (4 checkboxes).

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `midi/TemplateEditor.vue` | 8 template tabs, each with a table of Macro 1–8 → CC number inputs | none |
| `midi/TrackRouting.vue` | MIDI Track 1–4 → MIDI Channel selects (1–15) | none |

**Store:** `stores/midi.js`

State:
- `templates` — `ref(Array[8])` — each: `{ name: 'Template N', macroCC: [1,2,5,11,12,13,71,74] }` — default CCs from spec
- `trackRouting` — `ref([1,2,3,4])` — MIDI channels for MIDI tracks 1–4
- `clockIn` — `ref(false)`
- `clockOut` — `ref(false)`
- `syncOut` — `ref(false)`
- `dinMidiIn` / `dinMidiOut` / `usbMidiIn` / `usbMidiOut` — `ref(true)`

Actions:
- `setMacroCC(templateIndex, macroIndex, cc)` — updates CC number in memory
- `setTrackChannel(trackIndex, channel)` — updates channel routing in memory

API calls: None. Clock sync and DIN/USB toggles are bound directly to store refs via `v-model` but never persisted to server or sent to device.

**Server Routes:** None dedicated. No `/api/midi` routes exist.

**WebSocket events:** None specific to MIDI settings.

**Data flow summary:** MIDI settings are purely local browser state. There is no mechanism to read or write these settings to the physical device or persist them across sessions. The template CC assignments and track routing are display/configuration only — they would need to be cross-referenced manually when building MIDI automation.

**Known issues / TODOs:**
- The entire MIDI Settings tab is UI-only. No settings are persisted to server, device, or localStorage. Every browser refresh resets to defaults.
- Clock Sync checkboxes (`clockIn`, `clockOut`, `syncOut`) and DIN/USB port checkboxes have no server-side or SysEx counterpart. They are misleadingly interactive but do nothing.
- `trackRouting` values (1–15) are MIDI channel numbers but are never used by any other component (e.g. the sequencer uses hardcoded `TRACK_MIDI_CH` constants). The routing UI is purely decorative.
- Default `macroCC` in store (`[1,2,5,11,12,13,71,74]`) matches `DEFAULT_MIDI_TEMPLATE_CC` in `client/src/midi/constants.js`, but the Mixer store uses hardcoded `MACRO_CC_BASE = 80` (CC 80–87) for physical knob readback. These are different CC numbers serving different purposes — easy to confuse.

---

## Sessions

**Route:** `/sessions`

**View:** `client/src/views/SessionsView.vue` — Header with Projects/Packs sub-tabs. Projects tab: `ProjectGrid` (8×8 grid) + right sidebar with export/import actions and `SceneList`. Packs tab: list of 32 packs with inline rename and export. `onMounted` calls `store.fetchProjects()` and `store.fetchPacks()`.

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `sessions/ProjectGrid.vue` | 8×8 grid of 64 project slots with hover actions (rename, copy, export, delete); click selects project | none |
| `sessions/SceneList.vue` | Lists scenes for the selected project (from `store.activeProject`), shows pattern assignments per track, supports inline rename | `projectIndex: Number (required)` |

**Store:** `stores/sessions.js`

State:
- `projects` — `ref(Array[64])` — each: `{ name, index, color }` (stub; full data in `activeProject`)
- `activeProject` — `ref(null)` — full project object with `scenes` array loaded on selection
- `activeProjectIndex` — `ref(-1)`
- `loading` — `ref(false)`
- `packs` — `ref(Array[32])` — each: `{ index, name, sampleCount }`

Actions:
- `fetchProjects()` — `GET /api/sessions` → populates `projects` stubs
- `selectProject(index)` — `GET /api/sessions/:index` → loads full project into `activeProject`
- `renameProject(index, name)` — `PUT /api/sessions/:index` → updates name in store and server
- `copyProject(srcIndex, dstIndex)` — `POST /api/sessions/:srcIndex/copy`
- `deleteProject(index)` — `DELETE /api/sessions/:index` → resets to default
- `exportProject(index)` — triggers download via `/api/sessions/:index/export`
- `importProject(index, file)` — reads JSON file, `POST /api/sessions/import`
- `fetchPacks()` — `GET /api/sessions/packs`
- `renamePack(index, name)` — `PUT /api/sessions/packs/:index`
- `exportPack(index)` — triggers download via `/api/sessions/packs/:index/export`
- `renameScene(projectIndex, sceneIndex, name)` — `PUT /api/sessions/:projectIndex/scenes/:sceneIndex`

API calls: All actions use REST. No WebSocket or MIDI for sessions.

**Server Routes:** `server/routes/sessions.js`

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/sessions` | Returns 64 project stubs (index, name, color) |
| GET | `/api/sessions/packs` | Returns 32 packs array |
| PUT | `/api/sessions/packs/:index` | Renames a pack |
| GET | `/api/sessions/packs/:index/export` | Returns pack as JSON file download |
| POST | `/api/sessions/import` | Imports project from JSON body at specified index |
| GET | `/api/sessions/:index` | Returns full project with scenes |
| PUT | `/api/sessions/:index` | Updates project name/color |
| POST | `/api/sessions/:index/copy` | Deep-copies project to target slot (name gets " (copy)" suffix, truncated to 16 chars) |
| DELETE | `/api/sessions/:index` | Resets project slot to default |
| GET | `/api/sessions/:index/export` | Returns project as JSON file download |
| PUT | `/api/sessions/:index/scenes/:sceneIndex` | Updates scene name or pattern assignments |

All session data is in-memory on the server (no disk persistence).

**WebSocket events:** None.

**Data flow summary:** On mount, `fetchProjects` and `fetchPacks` populate the browser store from the server's in-memory arrays. Clicking a project slot calls `selectProject` which fetches full project data (including scenes). All mutations (rename, copy, delete, import) are REST calls that update the server's in-memory store and then update the browser store from the response.

**Known issues / TODOs:**
- All session/project/pack/scene data is in-memory on the server. A server restart wipes everything.
- Sessions have no relationship to the physical device. There is no mechanism to read sessions from or write sessions to Circuit Tracks. The sessions tab is entirely local server-side data management.
- Import accepts `.json` files (not `.syx`). The import button in `SessionsView.vue` has `accept=".json"`, but the export also produces `.json`. Circuit Tracks itself uses `.syx` for session backup; there is no round-trip with the device.
- `copyProject` appends ` (copy)` to the project name and slices to 16 chars server-side. If the source name is 14+ chars, the suffix gets truncated silently.
- `SceneList.vue` accesses `store.activeProject.scenes[i].patterns[t]` but `activeProject` is loaded lazily via `selectProject`. If `activeProject` is null, the component shows "Select a project to view its scenes." — this is handled correctly, but the `projectIndex` prop is required and could mismatch if the parent passes an index before the data arrives.

---

## Device

**Route:** `/device`

**View:** `client/src/views/DeviceView.vue` — Thin wrapper, max-width 640px, renders `DevicePanel`.

**Components:**

| File | Role | Key props/emits |
|------|------|-----------------|
| `device/DevicePanel.vue` | Full device management panel: Web MIDI enable button, connection status, MIDI port list with Connect/Disconnect, Global Settings (Tempo/Swing/Transpose), Firmware section | none |

**Store:** `stores/device.js`

State:
- `connected` — `ref(false)`
- `portName` — `ref('')`
- `firmwareVersion` — `ref('')` — never populated (no code reads firmware version)
- `availablePorts` — `ref([])` — list of MIDI port names
- `lastActivity` — `ref(null)` — timestamp, set by `recordActivity()`
- `midiInitialized` — `ref(false)`
- `midiSupported` — `ref(!!navigator.requestMIDIAccess)` — browser capability flag
- `statusText` — computed: `'Connected: <portName>'` or `'Disconnected'`
- `watchdogTimer` — internal interval every 2s checking port availability

Actions:
- `initMidi()` — calls `requestAccess()` from `useMidi`; registers `connected/disconnected/portschange` event handlers; starts watchdog
- `fetchPorts()` — refreshes `availablePorts` from `getPorts()`
- `connect(port)` — calls `midiConnect(port)` from `useMidi`; updates `connected/portName`
- `disconnect()` — calls `forgetDevice()` from `useMidi`; clears state
- `recordActivity()` — sets `lastActivity` timestamp
- `setConnected(port)` / `setDisconnected()` — called by `useWebSocket.dispatch` on `device:status` messages

API calls (from `DevicePanel.vue` directly, not store):
- `POST /api/device/tempo` — `{ bpm }` body
- `POST /api/device/swing` — `{ amount }` body
- `POST /api/device/transpose` — `{ semitones }` body

**Server Routes:** `server/routes/device.js`

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/device/ports` | Returns available MIDI port names |
| POST | `/api/device/connect` | Connects server MIDI to named port |
| POST | `/api/device/disconnect` | Disconnects server MIDI |
| GET | `/api/device/status` | Returns `{ connected, port }` |
| POST | `/api/device/tempo` | Maps BPM 40–240 → CC 0x51 on Ch 0; best-effort (not a real SysEx tempo command) |
| POST | `/api/device/swing` | Maps 0–100% → CC 0x52 on Ch 0; best-effort |
| POST | `/api/device/transpose` | Maps -12–+12 → CC 0x53 on Ch 0; best-effort |

**WebSocket events:**
- Incoming (server→client): `device:status` — `{ type, connected, port }` — sent on new WS connection and not broadcast on connect/disconnect (only on new client connection). `App.vue` listens for this to show toast notifications.

**Data flow summary:** User clicks "Enable MIDI" → `initMidi()` → `requestAccess()` gets browser MIDI access. User clicks "Connect" on a port → `connect(port)` opens Web MIDI input/output ports. `onMidiMessage` in `useMidi` starts receiving messages. The device store watchdog polls every 2s to detect disconnection. Server-side connection (for SysEx bridge / WebSocket relay) is separate — managed via `POST /api/device/connect`.

**Known issues / TODOs:**
- `firmwareVersion` is never populated. There is no code anywhere that reads firmware version from the device (would require a SysEx identity request). The Firmware section in `DevicePanel.vue` always shows "Version unknown — connect device to read".
- Firmware update button in `DevicePanel.vue` has `disabled` on the file input and shows "UI placeholder — not yet implemented". It is a purely visual stub.
- Tempo/Swing/Transpose use undocumented CC numbers (0x51, 0x52, 0x53) — these are labelled "best-effort" in comments. The Programmer's Reference does not document these as standard controls; actual tempo on Circuit Tracks is set via SysEx. These CC commands likely have no effect on the device.
- The server has `GET /api/device/ports`, `POST /api/device/connect`, and `GET /api/device/status` routes, but `DevicePanel.vue` does not use them — it connects directly via Web MIDI in the browser. The server routes are only useful for a headless/non-Chrome environment, but that path is not wired in the client.
- `useWebSocket` sends `device:status` to each new WebSocket client on connection. However, if the device connects/disconnects at the server level (not browser Web MIDI), there is no broadcast to existing clients — only new connections get the status.

---

## Shared Infrastructure

### MIDI Layer

**`client/src/midi/constants.js`**

Exports:
- `SYSEX_MANUFACTURER_ID = [0x00, 0x20, 0x29]` — Novation manufacturer ID
- `SYSEX_PRODUCT_FAMILY = 0x01`, `SYSEX_PRODUCT_CIRCUIT_TRACKS = 0x64`
- Host→Device commands: `CMD_WRITE_PATCH = 0x05`, `CMD_REPLACE_CURRENT_PATCH = 0x06`, `CMD_REQUEST_PATCH_DUMP = 0x40`, `CMD_REQUEST_CURRENT_PATCH = 0x63`
- Device→Host commands: `CMD_PATCH_DUMP = 0x01`, `CMD_CURRENT_PATCH_DUMP = 0x02`
- `SYNTH_TRACK_1 = 0x00`, `SYNTH_TRACK_2 = 0x01`
- `PATCH_BANK_SIZE = 64`, `PATCH_DATA_BYTES = 220`, `PATCH_SYSEX_PAYLOAD_BYTES = 256`
- `SYSEX_MIN_DELAY_MS = 20`, `SYSEX_DUMP_TIMEOUT_MS = 3000`
- `MACRO_KNOB_CC = [80,81,82,83,84,85,86,87]`
- `DEFAULT_MIDI_TEMPLATE_CC = [1,2,5,11,12,13,71,74]`
- `SESSION_CONTROL_CH = 15`, `SESSION_VOL_CC = { SYNTH1:7, SYNTH2:8, DRUM1:9, DRUM2:10, DRUM3:11, DRUM4:12 }`
- `CH_SYNTH1=0, CH_SYNTH2=1, CH_DRUM1=5, CH_DRUM2=6, CH_DRUM3=7, CH_DRUM4=8`
- `NRPN_DISTORTION_TYPE = { msb:1, lsb:0 }`, `NRPN_CHORUS_TYPE = { msb:1, lsb:24 }`
- `DISTORTION_TYPES = ['Diode','Valve','Clipper','X-Shape','Bit Crush','Rate Red.','Decimator']`
- `DEVICE_PORT_PATTERNS = [/circuit tracks/i, /circuit/i, /novation/i]`
- `P` object — full byte offset map for the 220-byte patch data (name at 0, OSC A at 16–23, OSC B at 24–30, Sub at 31–32, Filter at 33–40, Filter Env at 41–44, Amp Env at 45–48, Amp at 49–51, LFO1 at 52–57, LFO2 at 58–63, Mod Envs 1–3 at 64–75, Mod Matrix at 76–135, Macros at 136–143, Distortion at 144–145, Chorus at 146–150, Reverb/Delay Send at 151–152)
- `MOD_SOURCES` object (13 entries: LFO1, LFO2, Env1–3, Macro1–8)
- `MOD_DESTINATIONS` object (21 entries)

**`client/src/midi/sysex.js`**

Browser-side SysEx builder + parser. Functions exported:
- `pack7bit(raw)` — packs 8-bit array into 7-bit SysEx data (every 7 bytes → 8 bytes, first byte is MSB flags)
- `unpack7bit(packed)` — inverse
- `buildRequestCurrentPatch(synthTrack)` — `F0 00 20 29 01 64 63 synthTrack F7`
- `buildRequestPatchDump(patchIndex, bank)` — `F0 00 20 29 01 64 40 bank patchIndex F7`
- `buildReplaceCurrentPatch(rawBytes, synthTrack)` — `F0 00 20 29 01 64 06 synthTrack <packed> F7`
- `buildWritePatch(rawBytes, patchIndex, bank)` — `F0 00 20 29 01 64 05 bank patchIndex <packed> F7`
- `buildPatchDumpMessage(rawBytes, patchIndex, bank)` — `F0 00 20 29 01 64 01 bank patchIndex <packed> F7` (export format)
- `buildBankSyx(patches)` — 64 concatenated `buildPatchDumpMessage` calls → `Uint8Array`
- `parseSyxFile(fileBytes)` — scans for F0…F7 boundaries, calls `_parseSinglePatchMessage` on each, returns `[{ patchIndex, bank, rawBytes }]`
- `parseSysEx(bytes)` — parses a single incoming SysEx, returns `{ type:'patchDump'|'currentPatchDump'|'unknown', bank, patchIndex, rawBytes, params }` or null
- `decodePatchName(rawBytes)` — reads bytes 0–15, strips nulls
- `encodePatchName(name, rawBytes)` — writes name into bytes 0–15
- `rawBytesToParams(raw)` — maps 220 raw bytes → structured params object (all sections)
- `paramsToBytesPartial(params, existingRaw)` — merges partial params back into raw bytes
- `defaultPatchBytes(index)` — returns 220-byte init patch (Saw wave, LP24 filter, default ADSR)

**`server/midi/MidiManager.js`**

Singleton exported as `export default new MidiManager()`. Uses `easymidi` (graceful fallback if not installed). Methods:
- `getAvailablePorts()` — returns ports that have both input AND output (bidirectional)
- `findCircuitPort()` — searches `DEVICE_PORT_PATTERNS` for auto-detect
- `connect(portName)` — opens easymidi Input + Output, registers message handlers (sysex, cc, noteon, noteoff, clock, start, stop, continue)
- `disconnect()` — rejects pending SysEx responses, closes ports
- `isConnected()` — `input !== null && output !== null`
- `sendSysEx(bytes)` — enforces 20ms minimum inter-message gap before sending
- `sendSysExAndWait(bytes, responseCmd, timeoutMs)` — registers in `_pendingResponses`, sends, resolves/rejects on matching incoming SysEx command byte
- `sendCC(channel, controller, value)`
- `sendStart()` / `sendStop()` / `sendContinue()` — MIDI transport messages
- `_onClock()` — 24 PPQN → emits `clock:step` every 6 ticks; resets at 192 ticks (32 steps)
- `on(event, handler)` / `off(event, handler)` / `_emit(event, data)`
- `_onSysEx(msg)` — resolves pending response if command matches, always emits `sysex` event

**`server/midi/SysExBuilder.js`**

Same functions as client `sysex.js` (duplicated intentionally for server-side use). Exports:
- `pack7bit`, `unpack7bit`
- `buildRequestCurrentPatch`, `buildRequestPatchDump`, `buildReplaceCurrentPatch`, `buildWritePatch`, `buildPatchDumpMessage`, `buildBankSyx`
- `parseSyxFile`, `decodePatchName`, `encodePatchName`, `rawBytesToParams`, `paramsToBytesPartial`, `defaultPatchBytes`

**`server/midi/SysExParser.js`**

Single exported function:
- `parseSysEx(bytes)` — validates Novation header (manufacturer `00 20 29`, family `0x01`, product `0x64`), dispatches on command byte `CMD_PATCH_DUMP (0x01)` or `CMD_CURRENT_PATCH_DUMP (0x02)`, calls `unpack7bit` + `rawBytesToParams`, returns `{ type, bank, patchIndex, rawBytes, params }` or `{ type:'unknown', command, data }`

**`server/midi/constants.js`**

Same constants as client `constants.js` except:
- Uses `DEFAULT_MACRO_CC` (not `DEFAULT_MIDI_TEMPLATE_CC` — different name, same values)
- Does not export `MACRO_KNOB_CC`, `SESSION_VOL_CC`, `CH_SYNTH1/2/DRUM1-4`, `NRPN_*`, `DISTORTION_TYPES` (those are client-only)
- Comments include exact Programmer's Reference v3 page references

---

### WebSocket Protocol

All messages are JSON. The WebSocket server is at path `/ws`.

**Server → Client:**

| type | Payload fields | When sent |
|------|---------------|-----------|
| `device:status` | `{ connected: bool, port: string\|null }` | On new WebSocket connection |
| `patch:update` | `{ track: 0\|1, index: 0-63, name: string, params: object, rawBytes: number[] }` | When a `CMD_PATCH_DUMP (0x01)` SysEx arrives from device |
| `patch:currentDump` | `{ track: 0\|1, params: object, rawBytes: number[] }` | When a `CMD_CURRENT_PATCH_DUMP (0x02)` SysEx arrives |
| `midi:cc` | `{ channel: 0-15, controller: 0-127, value: 0-127 }` | Every CC message from device |
| `midi:noteon` | `{ channel, note, velocity }` | Every NoteOn from device |
| `midi:noteoff` | `{ channel, note, velocity }` | Every NoteOff from device |
| `midi:sysex` | `{ data: number[] }` | Every SysEx from device (raw bytes, for debug) |
| `midi:out` | `{}` | When server sends SysEx to device (activity indicator) |
| `sequencer:step` | `{ step: 0-31 }` | Every 6 MIDI clock ticks from device |
| `sequencer:transport` | `{ state: 'start'\|'stop'\|'continue' }` | On MIDI Start/Stop/Continue from device |
| `pong` | `{}` | In response to `ping` |

**Client → Server:**

| type | Payload | When sent |
|------|---------|-----------|
| `ping` | `{}` | Sent by client to keep connection alive (not wired in current code — only `handleClientMessage` responds to it) |

**Reconnect behaviour:** Client auto-reconnects every 3000ms on close. URL is `ws://${location.host}/ws` in dev (proxied by Vite), or derived from `VITE_WS_URL` env var.

---

### Composables

**`useWebSocket.js`**

Exports:
- `midiActivity` — reactive `{ in: bool, out: bool }` — used by `StatusBar.vue` for MIDI activity indicators
- `flashMidiIn()` / `flashMidiOut()` — set activity flags for 300ms
- `useWebSocket()` — returns `{ on(type, handler), off(type, handler) }` — component-level subscription with auto-cleanup on `onUnmounted`
- `initWebSocket()` — imperative connect (same as calling `connect()` internally)

Internal `dispatch(msg)` handles: `device:status`, `patch:update`, `patch:currentDump`, `midi:cc`, `midi:noteon`, `midi:noteoff`, `midi:sysex`, `sequencer:step`, `sequencer:transport`. Guards on `midiConnected()` prevent double-processing when Web MIDI is active.

Module-level side effects on load: wires `useMidi` events (`ccout`, `sysexout`, `noteout`, `nrpnout`, `cc`, `sysex`, `noteon`) to `flashMidiOut`/`flashMidiIn`.

**`useMidi.js`**

Web MIDI API singleton. All functions are named exports (not a class). State held in module-level variables.

Exports:
- `requestAccess()` — calls `navigator.requestMIDIAccess({ sysex: true })`
- `getPorts()` — returns port names that have both input and output; sorts Circuit Tracks ports first
- `connect(portName)` — opens input+output, sets `onmidimessage`
- `disconnect()` — clears ports, emits `disconnected`
- `forgetDevice()` — also clears `lastPortName` (disables auto-reconnect)
- `getPortName()` / `isConnected()`
- `sendCC(channel, controller, value)` — sends `0xB0|ch, cc, val`; emits `ccout`
- `sendSysEx(bytes)` — enforces 20ms gap; sends `Uint8Array`; emits `sysexout`
- `sendSysExAndWait(bytes, responseCmd, timeout)` — registers in `pendingResponses`, sends, resolves on matching cmd byte in incoming SysEx
- `sendStart()` / `sendStop()` / `sendContinue()` — `0xFA`, `0xFC`, `0xFB`
- `sendNoteOn(ch, note, vel)` / `sendNoteOff(ch, note, vel)` — emits `noteout`
- `sendNRPN(ch, msb, lsb, value)` — sends 4 CC messages (CC99=msb, CC98=lsb, CC6=value, CC38=0); emits `nrpnout`
- `on(event, handler)` / `off(event, handler)` — module-level event bus
- `useMidi()` — convenience wrapper returning all named exports

MIDI clock: `_clockTick()` increments `_clockTicks`, emits `clock:step` every 6 ticks with step index `((_clockTicks/6)-1) % 32`. Resets at 192 ticks.

**`useKeyboard.js`**

Exports `useKeyboard(onToggleShortcuts)`. Registers global `keydown` listener, cleaned up on `onUnmounted`.

Shortcuts:
- `1`–`7` → navigate to `/patches`, `/samples`, `/sequencer`, `/mixer`, `/midi`, `/sessions`, `/device`
- `Space` → toggle play/stop via `POST /api/transport/play` or `/stop` (always REST, even when Web MIDI connected)
- `Escape` → stop via `POST /api/transport/stop`
- `Ctrl+Z` → undo (handler is `e.preventDefault()` only — no actual undo)
- `Ctrl+Shift+Z` → redo (handler is `e.preventDefault()` only — no actual redo)
- `Tab` / `Shift+Tab` → cycle tabs
- `?` → calls `onToggleShortcuts` callback

**`useToast.js`**

Module-level singleton `toasts` array (reactive). Exports `useToast()` → `{ toast(text, { type, duration }), toasts, dismiss(id) }`. Max 4 toasts; oldest dropped when limit reached. Types: `'info' | 'success' | 'warning' | 'error'`. Auto-dismiss after `duration` ms (default 3000).

---

### Router

`client/src/router/index.js` — `createWebHashHistory` (hash-based routing, works without server). Routes:

| Path | Component |
|------|-----------|
| `/` | redirects to `/patches` |
| `/patches` | `PatchesView.vue` (lazy) |
| `/samples` | `SamplesView.vue` (lazy) |
| `/sequencer` | `SequencerView.vue` (lazy) |
| `/mixer` | `MixerView.vue` (lazy) |
| `/midi` | `MidiView.vue` (lazy) |
| `/sessions` | `SessionsView.vue` (lazy) |
| `/device` | `DeviceView.vue` (lazy) |
| `/midi-ref` | `MidiRefView.vue` (lazy) — MIDI Cheatsheet viewer |

### App Bootstrap (`main.js` / `App.vue`)

`main.js`: Creates Pinia + Vue Router, mounts `App`. Restores saved theme from `localStorage`.

`App.vue`: Initializes `useWebSocket()` (auto-connects to WS), `useKeyboard()` (global shortcuts), `useToast()`. Listens for `device:status` WS events to show connect/disconnect toast notifications. Layout: `AppHeader` → `TabNav` → `RouterView` → `StatusBar`, plus `ToastContainer` and `ShortcutsModal` overlays.

`TabNav.vue` tabs: Patches, Samples, Sequencer, Mixer, MIDI, Sessions, Device, MIDI Ref (8 tabs total).

`AppHeader.vue`: Shows app name, device connection status dot + text, dark/light theme toggle (persisted to `localStorage`).

`StatusBar.vue`: Shows "Novation Circuit Tracks Web UI" label, connection status dot, MIDI IN/OUT activity indicators (driven by `midiActivity` from `useWebSocket`).
