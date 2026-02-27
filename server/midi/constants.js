// Novation Circuit Tracks SysEx constants
// Reference: Circuit Tracks Programmer's Reference Guide v3
// https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_programmer_s_reference_guide_v3.pdf

// Novation manufacturer ID (3 bytes)
export const SYSEX_MANUFACTURER_ID = [0x00, 0x20, 0x29]

// Product family / product bytes in SysEx header
// Family 0x01 = Novation; Product 0x64 = Circuit Tracks
// (Original Circuit = 0x60, Circuit Mono Station = 0x62, Circuit Tracks = 0x64)
export const SYSEX_PRODUCT_FAMILY        = 0x01
export const SYSEX_PRODUCT_CIRCUIT_TRACKS = 0x64

// ── Command bytes ────────────────────────────────────────────────────────────
// Host → Device
export const CMD_WRITE_PATCH           = 0x05  // write patch to bank slot
export const CMD_REPLACE_CURRENT_PATCH = 0x06  // send patch as "current" (auditions it live)
export const CMD_REQUEST_PATCH_DUMP    = 0x40  // request single patch from bank
export const CMD_REQUEST_CURRENT_PATCH = 0x63  // request currently-active patch

// Device → Host
export const CMD_PATCH_DUMP         = 0x01  // single patch dump response
export const CMD_CURRENT_PATCH_DUMP = 0x02  // current patch dump response

// ── Synth track selectors ────────────────────────────────────────────────────
export const SYNTH_TRACK_1 = 0x00
export const SYNTH_TRACK_2 = 0x01

// ── Bank / patch sizes ───────────────────────────────────────────────────────
export const PATCH_BANK_SIZE       = 64   // patches per bank
export const PATCH_DATA_BYTES      = 220  // raw parameter bytes per patch
// 7-bit packing: every 7 raw bytes → 8 SysEx bytes
// ceil(220/7) = 32 groups → 32×8 = 256 SysEx payload bytes
export const PATCH_SYSEX_PAYLOAD_BYTES = 256

// ── SysEx timing ─────────────────────────────────────────────────────────────
export const SYSEX_MIN_DELAY_MS    = 20    // minimum gap between consecutive SysEx messages
export const SYSEX_DUMP_TIMEOUT_MS = 3000  // wait up to 3 s for a patch dump reply

// ── Default CC assignments for macro knobs ───────────────────────────────────
export const DEFAULT_MACRO_CC = [1, 2, 5, 11, 12, 13, 71, 74]

// ── MIDI channels ────────────────────────────────────────────────────────────
export const MIDI_TRACK_COUNT      = 4
export const MIDI_RESERVED_CHANNEL = 16

// ── Port auto-detect patterns ────────────────────────────────────────────────
export const DEVICE_PORT_PATTERNS = [
  /circuit tracks/i,
  /circuit/i,
  /novation/i
]

// ── Patch parameter byte offsets within the 220-byte raw patch data ──────────
// Based on Programmer's Reference v3 synth patch structure.
// All parameter values are 7-bit (0–127) unless noted otherwise.
export const P = {
  // Name: 16 ASCII bytes (indices 0–15)
  NAME_START:  0,
  NAME_LEN:   16,

  // Oscillator A
  OSC_A_WAVE:        16,  // 0=Sine 1=Tri 2=Saw 3=Pulse
  OSC_A_WAVE_INTERP: 17,  // wave interpolation
  OSC_A_COARSE:      18,  // coarse pitch (centre=64)
  OSC_A_FINE:        19,  // fine tune   (centre=64)
  OSC_A_PW:          20,  // pulse width
  OSC_A_MIX:         21,  // mix level
  OSC_A_FM:          22,  // FM depth (from OSC B)
  OSC_A_RING:        23,  // ring-mod depth

  // Oscillator B
  OSC_B_WAVE:        24,
  OSC_B_WAVE_INTERP: 25,
  OSC_B_COARSE:      26,
  OSC_B_FINE:        27,
  OSC_B_PW:          28,
  OSC_B_MIX:         29,
  OSC_B_DRIFT:       30,  // pitch drift

  // Sub oscillator
  SUB_WAVE:  31,  // 0=Sine 1=Square 2=–1oct 3=–2oct
  SUB_LEVEL: 32,

  // Filter
  FILTER_CUTOFF:    33,
  FILTER_RESONANCE: 34,
  FILTER_DRIVE:     35,
  FILTER_TYPE:      36,  // 0=LP12 1=LP24 2=HP12 3=HP24 4=BP12 5=BP24
  FILTER_ENV_AMT:   37,
  FILTER_VELOCITY:  38,
  FILTER_MOD1_AMT:  39,
  FILTER_MOD2_AMT:  40,

  // Filter envelope
  FENV_A: 41,
  FENV_D: 42,
  FENV_S: 43,
  FENV_R: 44,

  // Amp envelope
  AENV_A: 45,
  AENV_D: 46,
  AENV_S: 47,
  AENV_R: 48,

  // Amp level / pan / velocity
  AMP_LEVEL:    49,
  AMP_PAN:      50,  // centre=64
  AMP_VELOCITY: 51,

  // LFO 1
  LFO1_WAVE:  52,  // 0=Sine 1=Tri 2=Saw 3=Square 4=S&H
  LFO1_RATE:  53,
  LFO1_DEPTH: 54,
  LFO1_DELAY: 55,
  LFO1_FADE:  56,
  LFO1_SYNC:  57,  // 0=free 1=synced

  // LFO 2
  LFO2_WAVE:  58,
  LFO2_RATE:  59,
  LFO2_DEPTH: 60,
  LFO2_DELAY: 61,
  LFO2_FADE:  62,
  LFO2_SYNC:  63,

  // Mod envelope 1, 2, 3
  MENV1_A: 64, MENV1_D: 65, MENV1_S: 66, MENV1_R: 67,
  MENV2_A: 68, MENV2_D: 69, MENV2_S: 70, MENV2_R: 71,
  MENV3_A: 72, MENV3_D: 73, MENV3_S: 74, MENV3_R: 75,

  // Mod matrix: 20 slots × 3 bytes = 60 bytes (76–135)
  MOD_MATRIX_START:      76,
  MOD_MATRIX_SLOTS:      20,
  MOD_MATRIX_SLOT_BYTES:  3,   // [source, destination, depth]

  // Macro levels: 8 bytes (136–143)
  MACRO_LEVELS_START: 136,
  MACRO_COUNT:          8,

  // Distortion
  DISTORTION_ENABLE: 144,  // 0=off 1=on
  DISTORTION_AMOUNT: 145,

  // Chorus
  CHORUS_ENABLE:   146,  // 0=off 1=on
  CHORUS_RATE:     147,
  CHORUS_DEPTH:    148,
  CHORUS_FEEDBACK: 149,
  CHORUS_MIX:      150,

  // FX sends
  REVERB_SEND: 151,
  DELAY_SEND:  152,

  // Bytes 153–219 reserved
}

// ── Mod matrix source names ───────────────────────────────────────────────────
export const MOD_SOURCES = {
  0: 'LFO 1', 1: 'LFO 2',
  2: 'Env 1', 3: 'Env 2', 4: 'Env 3',
  5: 'Macro 1', 6: 'Macro 2', 7: 'Macro 3', 8: 'Macro 4',
  9: 'Macro 5', 10: 'Macro 6', 11: 'Macro 7', 12: 'Macro 8',
}

// ── Mod matrix destination names ─────────────────────────────────────────────
export const MOD_DESTINATIONS = {
  0:  'OSC A Pitch',   1: 'OSC A Wave',      2: 'OSC A PW',
  3:  'OSC A FM',      4: 'OSC B Pitch',      5: 'OSC B Wave',
  6:  'OSC B PW',      7: 'OSC Mix',          8: 'Sub Level',
  9:  'Filter Cutoff', 10: 'Filter Resonance', 11: 'Filter Drive',
  12: 'Filter Env Depth', 13: 'LFO 1 Rate',   14: 'LFO 1 Depth',
  15: 'LFO 2 Rate',   16: 'LFO 2 Depth',     17: 'Amp Level',
  18: 'Amp Pan',       19: 'Reverb Send',      20: 'Delay Send',
}
