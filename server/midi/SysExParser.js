import { SYSEX_MANUFACTURER_ID, SYSEX_DEVICE_ID } from './constants.js'

/**
 * Parse a raw SysEx byte array from Circuit Tracks.
 * Returns { command, channel, data } or null if unrecognised.
 */
export function parseSysEx(bytes) {
  // bytes[0] = 0xF0, bytes[last] = 0xF7
  if (!bytes || bytes.length < 7) return null
  if (bytes[0] !== 0xF0 || bytes[bytes.length - 1] !== 0xF7) return null

  const mfr = [bytes[1], bytes[2], bytes[3]]
  if (!mfr.every((b, i) => b === SYSEX_MANUFACTURER_ID[i])) return null
  if (bytes[4] !== SYSEX_DEVICE_ID) return null

  const command = bytes[5]
  const channel = bytes[6]
  const data = bytes.slice(7, bytes.length - 1)

  return { command, channel, data }
}

/**
 * Parse patch data bytes into a structured patch object.
 * The exact layout follows Circuit Tracks Programmer's Reference v3.
 */
export function parsePatchData(data) {
  if (!data || data.length < 92) return null

  return {
    name: decodeName(data.slice(0, 15)),
    oscA: {
      wave: data[15] & 0x03,
      pitch: data[16],
      detune: data[17],
      pulseWidth: data[18]
    },
    oscB: {
      wave: data[19] & 0x03,
      pitch: data[20],
      detune: data[21],
      pulseWidth: data[22]
    },
    oscMix: data[23],
    filter: {
      type: data[24] & 0x03,
      cutoff: data[25],
      resonance: data[26],
      drive: data[27],
      envAmount: data[28]
    },
    filterEnv: {
      attack: data[29],
      decay: data[30],
      sustain: data[31],
      release: data[32]
    },
    ampEnv: {
      attack: data[33],
      decay: data[34],
      sustain: data[35],
      release: data[36]
    },
    lfo: {
      wave: data[37] & 0x03,
      speed: data[38],
      amount: data[39],
      destination: data[40]
    },
    chorus: {
      enabled: !!(data[41] & 0x01),
      rate: data[42],
      depth: data[43]
    },
    distortion: {
      enabled: !!(data[44] & 0x01),
      amount: data[45]
    },
    volume: data[46],
    pan: data[47],
    reverbSend: data[48],
    delaySend: data[49]
  }
}

function decodeName(bytes) {
  return bytes
    .filter(b => b !== 0)
    .map(b => String.fromCharCode(b))
    .join('')
    .trim() || 'Unnamed'
}
