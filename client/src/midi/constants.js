// Novation Circuit Tracks SysEx constants (browser-side copy)
// Reference: Circuit Tracks Programmer's Reference Guide v3

export const SYSEX_MANUFACTURER_ID = [0x00, 0x20, 0x29]

export const SYSEX_PRODUCT_FAMILY         = 0x01
export const SYSEX_PRODUCT_CIRCUIT_TRACKS = 0x64

// Host → Device
export const CMD_WRITE_PATCH           = 0x05
export const CMD_REPLACE_CURRENT_PATCH = 0x06
export const CMD_REQUEST_PATCH_DUMP    = 0x40
export const CMD_REQUEST_CURRENT_PATCH = 0x63

// Device → Host
export const CMD_PATCH_DUMP         = 0x01
export const CMD_CURRENT_PATCH_DUMP = 0x02

export const SYNTH_TRACK_1 = 0x00
export const SYNTH_TRACK_2 = 0x01

export const PATCH_BANK_SIZE           = 64
export const PATCH_DATA_BYTES          = 220
export const PATCH_SYSEX_PAYLOAD_BYTES = 256

export const SYSEX_MIN_DELAY_MS    = 20
export const SYSEX_DUMP_TIMEOUT_MS = 3000

// Macro knob physical CC positions — CC 80–87 on synth channel (Ref v3)
export const MACRO_KNOB_CC = [80, 81, 82, 83, 84, 85, 86, 87]

// Default CC assignments for MIDI track output template
export const DEFAULT_MIDI_TEMPLATE_CC = [1, 2, 5, 11, 12, 13, 71, 74]

// Session Control — all track volumes sent on Ch 16 (0-indexed: 15)
export const SESSION_CONTROL_CH = 15
export const SESSION_VOL_CC = { SYNTH1: 7, SYNTH2: 8, DRUM1: 9, DRUM2: 10, DRUM3: 11, DRUM4: 12 }

// MIDI channel assignments (0-indexed)
export const CH_SYNTH1 = 0   // Ch 1
export const CH_SYNTH2 = 1   // Ch 2
export const CH_DRUM1  = 5   // Ch 6
export const CH_DRUM2  = 6   // Ch 7
export const CH_DRUM3  = 7   // Ch 8
export const CH_DRUM4  = 8   // Ch 9

export const MIDI_TRACK_COUNT      = 4
export const MIDI_RESERVED_CHANNEL = 16

export const DEVICE_PORT_PATTERNS = [
  /circuit tracks/i,
  /circuit/i,
  /novation/i,
]

export const P = {
  NAME_START: 0,
  NAME_LEN:  16,

  OSC_A_WAVE:        16,
  OSC_A_WAVE_INTERP: 17,
  OSC_A_COARSE:      18,
  OSC_A_FINE:        19,
  OSC_A_PW:          20,
  OSC_A_MIX:         21,
  OSC_A_FM:          22,
  OSC_A_RING:        23,

  OSC_B_WAVE:        24,
  OSC_B_WAVE_INTERP: 25,
  OSC_B_COARSE:      26,
  OSC_B_FINE:        27,
  OSC_B_PW:          28,
  OSC_B_MIX:         29,
  OSC_B_DRIFT:       30,

  SUB_WAVE:  31,
  SUB_LEVEL: 32,

  FILTER_CUTOFF:    33,
  FILTER_RESONANCE: 34,
  FILTER_DRIVE:     35,
  FILTER_TYPE:      36,
  FILTER_ENV_AMT:   37,
  FILTER_VELOCITY:  38,
  FILTER_MOD1_AMT:  39,
  FILTER_MOD2_AMT:  40,

  FENV_A: 41,
  FENV_D: 42,
  FENV_S: 43,
  FENV_R: 44,

  AENV_A: 45,
  AENV_D: 46,
  AENV_S: 47,
  AENV_R: 48,

  AMP_LEVEL:    49,
  AMP_PAN:      50,
  AMP_VELOCITY: 51,

  LFO1_WAVE:  52,
  LFO1_RATE:  53,
  LFO1_DEPTH: 54,
  LFO1_DELAY: 55,
  LFO1_FADE:  56,
  LFO1_SYNC:  57,

  LFO2_WAVE:  58,
  LFO2_RATE:  59,
  LFO2_DEPTH: 60,
  LFO2_DELAY: 61,
  LFO2_FADE:  62,
  LFO2_SYNC:  63,

  MENV1_A: 64, MENV1_D: 65, MENV1_S: 66, MENV1_R: 67,
  MENV2_A: 68, MENV2_D: 69, MENV2_S: 70, MENV2_R: 71,
  MENV3_A: 72, MENV3_D: 73, MENV3_S: 74, MENV3_R: 75,

  MOD_MATRIX_START:      76,
  MOD_MATRIX_SLOTS:      20,
  MOD_MATRIX_SLOT_BYTES:  3,

  MACRO_LEVELS_START: 136,
  MACRO_COUNT:          8,

  DISTORTION_ENABLE: 144,
  DISTORTION_AMOUNT: 145,

  CHORUS_ENABLE:   146,
  CHORUS_RATE:     147,
  CHORUS_DEPTH:    148,
  CHORUS_FEEDBACK: 149,
  CHORUS_MIX:      150,

  REVERB_SEND: 151,
  DELAY_SEND:  152,
}

export const MOD_SOURCES = {
  0: 'LFO 1', 1: 'LFO 2',
  2: 'Env 1', 3: 'Env 2', 4: 'Env 3',
  5: 'Macro 1', 6: 'Macro 2', 7: 'Macro 3', 8: 'Macro 4',
  9: 'Macro 5', 10: 'Macro 6', 11: 'Macro 7', 12: 'Macro 8',
}

export const MOD_DESTINATIONS = {
  0:  'OSC A Pitch',   1: 'OSC A Wave',      2: 'OSC A PW',
  3:  'OSC A FM',      4: 'OSC B Pitch',      5: 'OSC B Wave',
  6:  'OSC B PW',      7: 'OSC Mix',          8: 'Sub Level',
  9:  'Filter Cutoff', 10: 'Filter Resonance', 11: 'Filter Drive',
  12: 'Filter Env Depth', 13: 'LFO 1 Rate',   14: 'LFO 1 Depth',
  15: 'LFO 2 Rate',   16: 'LFO 2 Depth',     17: 'Amp Level',
  18: 'Amp Pan',       19: 'Reverb Send',      20: 'Delay Send',
}
