import {
  SYSEX_MANUFACTURER_ID,
  SYSEX_PRODUCT_FAMILY,
  SYSEX_PRODUCT_CIRCUIT_TRACKS,
  CMD_PATCH_DUMP,
  CMD_CURRENT_PATCH_DUMP,
  PATCH_DATA_BYTES,
} from './constants.js'
import { unpack7bit, decodePatchName, rawBytesToParams } from './SysExBuilder.js'

/**
 * Parse a raw SysEx byte array received from Circuit Tracks.
 * Returns a structured object or null if the message is not recognised.
 */
export function parseSysEx(bytes) {
  const b = Array.isArray(bytes) ? bytes : Array.from(bytes)

  if (!b || b.length < 10) return null
  if (b[0] !== 0xF0 || b[b.length - 1] !== 0xF7) return null

  // Validate Novation manufacturer ID
  if (b[1] !== 0x00 || b[2] !== 0x20 || b[3] !== 0x29) return null

  // Validate product family + Circuit Tracks product byte
  if (b[4] !== SYSEX_PRODUCT_FAMILY) return null
  if (b[5] !== SYSEX_PRODUCT_CIRCUIT_TRACKS) return null

  const command = b[6]

  if (command === CMD_PATCH_DUMP || command === CMD_CURRENT_PATCH_DUMP) {
    const bank       = b[7] ?? 0
    const patchIndex = command === CMD_PATCH_DUMP ? (b[8] ?? 0) : null
    const payloadStart = command === CMD_PATCH_DUMP ? 9 : 8
    const packed     = b.slice(payloadStart, b.length - 1)
    const rawBytes   = unpack7bit(packed).slice(0, PATCH_DATA_BYTES)
    const params     = rawBytesToParams(rawBytes)

    return {
      type: command === CMD_PATCH_DUMP ? 'patchDump' : 'currentPatchDump',
      bank,
      patchIndex,
      rawBytes,
      params,
    }
  }

  // Unknown command — return raw for debug
  return {
    type: 'unknown',
    command,
    data: b.slice(7, b.length - 1),
  }
}
