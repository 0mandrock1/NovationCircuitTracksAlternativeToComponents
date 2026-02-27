// Novation Circuit Tracks SysEx constants
// Reference: Circuit Tracks Programmer's Reference v3

export const SYSEX_MANUFACTURER_ID = [0x00, 0x20, 0x29]
export const SYSEX_DEVICE_ID = 0x51
export const SYSEX_PRODUCT_ID = [0x01, 0x60]

// Command IDs
export const CMD_PATCH_DUMP_REQUEST = 0x40
export const CMD_PATCH_DUMP = 0x01
export const CMD_CURRENT_PATCH_DUMP_REQUEST = 0x63
export const CMD_REPLACE_CURRENT_PATCH = 0x06

// Synth track channels (1-indexed, MIDI channel in SysEx is 0-indexed)
export const SYNTH_TRACK_1 = 0x00
export const SYNTH_TRACK_2 = 0x01

// Patch bank size
export const PATCH_BANK_SIZE = 64

// Minimum delay between SysEx messages (ms)
export const SYSEX_MIN_DELAY_MS = 20

// Default CC assignments for macro knobs
export const DEFAULT_MACRO_CC = [1, 2, 5, 11, 12, 13, 71, 74]

// MIDI channels for MIDI tracks (1-15, 16 is reserved)
export const MIDI_TRACK_COUNT = 4
export const MIDI_RESERVED_CHANNEL = 16

// Circuit Tracks USB MIDI port name patterns
export const DEVICE_PORT_PATTERNS = [
  /circuit tracks/i,
  /circuit/i,
  /novation/i
]
