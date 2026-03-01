// SysEx builder + parser for Novation Circuit Tracks (browser-side)
// Merged from server/midi/SysExBuilder.js + server/midi/SysExParser.js

import {
  SYSEX_MANUFACTURER_ID,
  SYSEX_PRODUCT_FAMILY,
  SYSEX_PRODUCT_CIRCUIT_TRACKS,
  CMD_REPLACE_CURRENT_PATCH,
  CMD_WRITE_PATCH,
  CMD_REQUEST_PATCH_DUMP,
  CMD_REQUEST_CURRENT_PATCH,
  CMD_PATCH_DUMP,
  CMD_CURRENT_PATCH_DUMP,
  SYNTH_TRACK_1,
  PATCH_DATA_BYTES,
  P,
} from './constants.js'

// ── SysEx frame helpers ───────────────────────────────────────────────────────

function header(...cmdBytes) {
  return [
    0xF0,
    ...SYSEX_MANUFACTURER_ID,
    SYSEX_PRODUCT_FAMILY,
    SYSEX_PRODUCT_CIRCUIT_TRACKS,
    ...cmdBytes,
  ]
}

// ── 7-bit packing / unpacking ─────────────────────────────────────────────────

export function pack7bit(raw) {
  const bytes = Array.from(raw)
  const out = []
  for (let i = 0; i < bytes.length; i += 7) {
    const chunk = bytes.slice(i, i + 7)
    let msbs = 0
    for (let j = 0; j < chunk.length; j++) {
      if (chunk[j] & 0x80) msbs |= (1 << j)
    }
    out.push(msbs)
    for (const b of chunk) out.push(b & 0x7F)
  }
  return out
}

export function unpack7bit(packed) {
  const out = []
  for (let i = 0; i < packed.length; i += 8) {
    const msbs  = packed[i]
    const count = Math.min(7, packed.length - i - 1)
    for (let j = 0; j < count; j++) {
      out.push((packed[i + 1 + j] & 0x7F) | ((msbs >> j & 1) ? 0x80 : 0))
    }
  }
  return out
}

// ── Builder functions ─────────────────────────────────────────────────────────

export function buildRequestCurrentPatch(synthTrack = SYNTH_TRACK_1) {
  return [...header(CMD_REQUEST_CURRENT_PATCH, synthTrack), 0xF7]
}

export function buildRequestPatchDump(patchIndex, bank = 0) {
  return [...header(CMD_REQUEST_PATCH_DUMP, bank, patchIndex), 0xF7]
}

export function buildReplaceCurrentPatch(rawBytes, synthTrack = SYNTH_TRACK_1) {
  const packed = pack7bit(Array.from(rawBytes))
  return [...header(CMD_REPLACE_CURRENT_PATCH, synthTrack), ...packed, 0xF7]
}

export function buildWritePatch(rawBytes, patchIndex, bank = 0) {
  const packed = pack7bit(Array.from(rawBytes))
  return [...header(CMD_WRITE_PATCH, bank, patchIndex), ...packed, 0xF7]
}

export function buildPatchDumpMessage(rawBytes, patchIndex, bank = 0) {
  const packed = pack7bit(Array.from(rawBytes))
  return [...header(CMD_PATCH_DUMP, bank, patchIndex), ...packed, 0xF7]
}

export function buildBankSyx(patches) {
  const msgs = []
  for (let i = 0; i < 64; i++) {
    const raw = patches[i] ?? defaultPatchBytes(i)
    msgs.push(buildPatchDumpMessage(raw, i))
  }
  return new Uint8Array(msgs.flat())
}

// ── .syx file parser ──────────────────────────────────────────────────────────

export function parseSyxFile(fileBytes) {
  const bytes = Array.isArray(fileBytes) ? fileBytes : Array.from(fileBytes)
  const patches = []
  let i = 0
  while (i < bytes.length) {
    if (bytes[i] !== 0xF0) { i++; continue }
    const start = i
    while (i < bytes.length && bytes[i] !== 0xF7) i++
    if (i >= bytes.length) break
    const msg    = bytes.slice(start, i + 1)
    i++
    const parsed = _parseSinglePatchMessage(msg)
    if (parsed) patches.push(parsed)
  }
  return patches
}

function _parseSinglePatchMessage(msg) {
  if (msg.length < 10) return null
  if (msg[0] !== 0xF0) return null
  if (msg[1] !== 0x00 || msg[2] !== 0x20 || msg[3] !== 0x29) return null
  if (msg[4] !== SYSEX_PRODUCT_FAMILY) return null
  if (msg[5] !== SYSEX_PRODUCT_CIRCUIT_TRACKS) return null
  if (msg[6] !== CMD_PATCH_DUMP) return null

  const bank       = msg[7] ?? 0
  const patchIndex = msg[8] ?? 0
  const packed     = msg.slice(9, msg.length - 1)
  const rawBytes   = unpack7bit(packed).slice(0, PATCH_DATA_BYTES)
  return { patchIndex, bank, rawBytes }
}

// ── Incoming SysEx parser ─────────────────────────────────────────────────────

export function parseSysEx(bytes) {
  const b = Array.isArray(bytes) ? bytes : Array.from(bytes)

  if (!b || b.length < 10) return null
  if (b[0] !== 0xF0 || b[b.length - 1] !== 0xF7) return null
  if (b[1] !== 0x00 || b[2] !== 0x20 || b[3] !== 0x29) return null
  if (b[4] !== SYSEX_PRODUCT_FAMILY) return null
  if (b[5] !== SYSEX_PRODUCT_CIRCUIT_TRACKS) return null

  const command = b[6]

  if (command === CMD_PATCH_DUMP || command === CMD_CURRENT_PATCH_DUMP) {
    const bank         = b[7] ?? 0
    const patchIndex   = command === CMD_PATCH_DUMP ? (b[8] ?? 0) : null
    const payloadStart = command === CMD_PATCH_DUMP ? 9 : 8
    const packed       = b.slice(payloadStart, b.length - 1)
    const rawBytes     = unpack7bit(packed).slice(0, PATCH_DATA_BYTES)
    const params       = rawBytesToParams(rawBytes)

    return {
      type: command === CMD_PATCH_DUMP ? 'patchDump' : 'currentPatchDump',
      bank,
      patchIndex,
      rawBytes,
      params,
    }
  }

  return { type: 'unknown', command, data: b.slice(7, b.length - 1) }
}

// ── Patch parameter helpers ───────────────────────────────────────────────────

export function decodePatchName(rawBytes) {
  return Array.from(rawBytes.slice(P.NAME_START, P.NAME_START + P.NAME_LEN))
    .filter(b => b > 0)
    .map(b => String.fromCharCode(b))
    .join('')
    .trim() || 'Unnamed'
}

export function encodePatchName(name, rawBytes) {
  const out = Array.from(rawBytes)
  const str = (name || '').slice(0, P.NAME_LEN).padEnd(P.NAME_LEN, '\0')
  for (let i = 0; i < P.NAME_LEN; i++) out[P.NAME_START + i] = str.charCodeAt(i) & 0x7F
  return out
}

export function rawBytesToParams(raw) {
  const b = Array.from(raw)
  const mm = []
  for (let s = 0; s < P.MOD_MATRIX_SLOTS; s++) {
    const off = P.MOD_MATRIX_START + s * P.MOD_MATRIX_SLOT_BYTES
    mm.push({ source: b[off] ?? 0, destination: b[off + 1] ?? 0, depth: b[off + 2] ?? 64 })
  }
  return {
    name: decodePatchName(raw),
    oscA: {
      wave: b[P.OSC_A_WAVE] ?? 2, waveInterp: b[P.OSC_A_WAVE_INTERP] ?? 0,
      coarse: b[P.OSC_A_COARSE] ?? 64, fine: b[P.OSC_A_FINE] ?? 64,
      pw: b[P.OSC_A_PW] ?? 64, mix: b[P.OSC_A_MIX] ?? 100,
      fm: b[P.OSC_A_FM] ?? 0, ring: b[P.OSC_A_RING] ?? 0,
    },
    oscB: {
      wave: b[P.OSC_B_WAVE] ?? 2, waveInterp: b[P.OSC_B_WAVE_INTERP] ?? 0,
      coarse: b[P.OSC_B_COARSE] ?? 64, fine: b[P.OSC_B_FINE] ?? 64,
      pw: b[P.OSC_B_PW] ?? 64, mix: b[P.OSC_B_MIX] ?? 0,
      drift: b[P.OSC_B_DRIFT] ?? 0,
    },
    sub: { wave: b[P.SUB_WAVE] ?? 0, level: b[P.SUB_LEVEL] ?? 0 },
    filter: {
      cutoff: b[P.FILTER_CUTOFF] ?? 100, resonance: b[P.FILTER_RESONANCE] ?? 0,
      drive: b[P.FILTER_DRIVE] ?? 0, type: b[P.FILTER_TYPE] ?? 1,
      envAmt: b[P.FILTER_ENV_AMT] ?? 0, velocity: b[P.FILTER_VELOCITY] ?? 0,
    },
    filterEnv: { a: b[P.FENV_A]??0, d: b[P.FENV_D]??60, s: b[P.FENV_S]??80, r: b[P.FENV_R]??40 },
    ampEnv:    { a: b[P.AENV_A]??0, d: b[P.AENV_D]??30, s: b[P.AENV_S]??100, r: b[P.AENV_R]??30 },
    amp: { level: b[P.AMP_LEVEL]??100, pan: b[P.AMP_PAN]??64, velocity: b[P.AMP_VELOCITY]??0 },
    lfo1: {
      wave: b[P.LFO1_WAVE]??0, rate: b[P.LFO1_RATE]??64, depth: b[P.LFO1_DEPTH]??0,
      delay: b[P.LFO1_DELAY]??0, fade: b[P.LFO1_FADE]??0, sync: b[P.LFO1_SYNC]??0,
    },
    lfo2: {
      wave: b[P.LFO2_WAVE]??0, rate: b[P.LFO2_RATE]??64, depth: b[P.LFO2_DEPTH]??0,
      delay: b[P.LFO2_DELAY]??0, fade: b[P.LFO2_FADE]??0, sync: b[P.LFO2_SYNC]??0,
    },
    modEnvs: [
      { a: b[P.MENV1_A]??0, d: b[P.MENV1_D]??60, s: b[P.MENV1_S]??0, r: b[P.MENV1_R]??40 },
      { a: b[P.MENV2_A]??0, d: b[P.MENV2_D]??60, s: b[P.MENV2_S]??0, r: b[P.MENV2_R]??40 },
      { a: b[P.MENV3_A]??0, d: b[P.MENV3_D]??60, s: b[P.MENV3_S]??0, r: b[P.MENV3_R]??40 },
    ],
    modMatrix: mm,
    macros: Array.from({ length: P.MACRO_COUNT }, (_, i) => b[P.MACRO_LEVELS_START + i] ?? 0),
    distortion: { enable: b[P.DISTORTION_ENABLE]??0, amount: b[P.DISTORTION_AMOUNT]??0 },
    chorus: {
      enable: b[P.CHORUS_ENABLE]??0, rate: b[P.CHORUS_RATE]??64,
      depth: b[P.CHORUS_DEPTH]??64, feedback: b[P.CHORUS_FEEDBACK]??0,
      mix: b[P.CHORUS_MIX]??64,
    },
    reverbSend: b[P.REVERB_SEND] ?? 0,
    delaySend:  b[P.DELAY_SEND]  ?? 0,
  }
}

export function paramsToBytesPartial(params, existingRaw) {
  const raw = Array.from(existingRaw ?? defaultPatchBytes())
  const set = (offset, value) => { if (offset < raw.length) raw[offset] = value & 0x7F }

  if (params.name !== undefined) {
    const str = params.name.slice(0, P.NAME_LEN).padEnd(P.NAME_LEN, '\0')
    for (let i = 0; i < P.NAME_LEN; i++) raw[P.NAME_START + i] = str.charCodeAt(i) & 0x7F
  }
  const a = params.oscA
  if (a) {
    set(P.OSC_A_WAVE, a.wave); set(P.OSC_A_WAVE_INTERP, a.waveInterp)
    set(P.OSC_A_COARSE, a.coarse); set(P.OSC_A_FINE, a.fine)
    set(P.OSC_A_PW, a.pw); set(P.OSC_A_MIX, a.mix)
    set(P.OSC_A_FM, a.fm); set(P.OSC_A_RING, a.ring)
  }
  const ob = params.oscB
  if (ob) {
    set(P.OSC_B_WAVE, ob.wave); set(P.OSC_B_WAVE_INTERP, ob.waveInterp)
    set(P.OSC_B_COARSE, ob.coarse); set(P.OSC_B_FINE, ob.fine)
    set(P.OSC_B_PW, ob.pw); set(P.OSC_B_MIX, ob.mix); set(P.OSC_B_DRIFT, ob.drift)
  }
  if (params.sub) { set(P.SUB_WAVE, params.sub.wave); set(P.SUB_LEVEL, params.sub.level) }
  const f = params.filter
  if (f) {
    set(P.FILTER_CUTOFF, f.cutoff); set(P.FILTER_RESONANCE, f.resonance)
    set(P.FILTER_DRIVE, f.drive); set(P.FILTER_TYPE, f.type)
    set(P.FILTER_ENV_AMT, f.envAmt); set(P.FILTER_VELOCITY, f.velocity)
  }
  const fe = params.filterEnv
  if (fe) { set(P.FENV_A, fe.a); set(P.FENV_D, fe.d); set(P.FENV_S, fe.s); set(P.FENV_R, fe.r) }
  const ae = params.ampEnv
  if (ae) { set(P.AENV_A, ae.a); set(P.AENV_D, ae.d); set(P.AENV_S, ae.s); set(P.AENV_R, ae.r) }
  const amp = params.amp
  if (amp) { set(P.AMP_LEVEL, amp.level); set(P.AMP_PAN, amp.pan); set(P.AMP_VELOCITY, amp.velocity) }
  const l1 = params.lfo1
  if (l1) {
    set(P.LFO1_WAVE, l1.wave); set(P.LFO1_RATE, l1.rate); set(P.LFO1_DEPTH, l1.depth)
    set(P.LFO1_DELAY, l1.delay); set(P.LFO1_FADE, l1.fade); set(P.LFO1_SYNC, l1.sync)
  }
  const l2 = params.lfo2
  if (l2) {
    set(P.LFO2_WAVE, l2.wave); set(P.LFO2_RATE, l2.rate); set(P.LFO2_DEPTH, l2.depth)
    set(P.LFO2_DELAY, l2.delay); set(P.LFO2_FADE, l2.fade); set(P.LFO2_SYNC, l2.sync)
  }
  if (params.modEnvs) {
    const offs = [
      [P.MENV1_A, P.MENV1_D, P.MENV1_S, P.MENV1_R],
      [P.MENV2_A, P.MENV2_D, P.MENV2_S, P.MENV2_R],
      [P.MENV3_A, P.MENV3_D, P.MENV3_S, P.MENV3_R],
    ]
    params.modEnvs.forEach((e, i) => { if (e) offs[i].forEach((o, j) => set(o, [e.a, e.d, e.s, e.r][j])) })
  }
  if (params.modMatrix) {
    params.modMatrix.forEach((slot, s) => {
      if (!slot) return
      const off = P.MOD_MATRIX_START + s * P.MOD_MATRIX_SLOT_BYTES
      raw[off] = slot.source & 0x7F; raw[off + 1] = slot.destination & 0x7F; raw[off + 2] = slot.depth & 0x7F
    })
  }
  if (params.macros) params.macros.forEach((v, i) => set(P.MACRO_LEVELS_START + i, v))
  const d = params.distortion
  if (d) { set(P.DISTORTION_ENABLE, d.enable); set(P.DISTORTION_AMOUNT, d.amount) }
  const ch = params.chorus
  if (ch) {
    set(P.CHORUS_ENABLE, ch.enable); set(P.CHORUS_RATE, ch.rate); set(P.CHORUS_DEPTH, ch.depth)
    set(P.CHORUS_FEEDBACK, ch.feedback); set(P.CHORUS_MIX, ch.mix)
  }
  if (params.reverbSend !== undefined) set(P.REVERB_SEND, params.reverbSend)
  if (params.delaySend  !== undefined) set(P.DELAY_SEND,  params.delaySend)
  return raw
}

export function defaultPatchBytes(index = 0) {
  const raw = new Array(PATCH_DATA_BYTES).fill(0)
  const name = `Init ${index + 1}`.slice(0, P.NAME_LEN).padEnd(P.NAME_LEN, '\0')
  for (let i = 0; i < P.NAME_LEN; i++) raw[i] = name.charCodeAt(i)
  raw[P.OSC_A_WAVE] = 2
  raw[P.OSC_A_COARSE] = 64; raw[P.OSC_A_FINE] = 64; raw[P.OSC_A_MIX] = 100
  raw[P.OSC_B_WAVE] = 2
  raw[P.OSC_B_COARSE] = 64; raw[P.OSC_B_FINE] = 64
  raw[P.FILTER_CUTOFF] = 100; raw[P.FILTER_TYPE] = 1
  raw[P.AENV_A] = 0; raw[P.AENV_D] = 30; raw[P.AENV_S] = 100; raw[P.AENV_R] = 30
  raw[P.AMP_LEVEL] = 100; raw[P.AMP_PAN] = 64
  return raw
}
