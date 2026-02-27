import {
  SYSEX_MANUFACTURER_ID,
  SYSEX_DEVICE_ID,
  CMD_PATCH_DUMP_REQUEST,
  CMD_REPLACE_CURRENT_PATCH,
  SYNTH_TRACK_1
} from './constants.js'

function buildHeader(command, channel) {
  return [0xF0, ...SYSEX_MANUFACTURER_ID, SYSEX_DEVICE_ID, command, channel]
}

/**
 * Build a SysEx message requesting the current patch dump for the given synth track.
 * channel: 0 = Synth 1, 1 = Synth 2
 */
export function buildCurrentPatchDumpRequest(channel = SYNTH_TRACK_1) {
  return [...buildHeader(CMD_PATCH_DUMP_REQUEST, channel), 0xF7]
}

/**
 * Build a SysEx message to replace the current patch on the device.
 * patchData: Uint8Array or array of patch bytes (92 bytes)
 * channel: 0 = Synth 1, 1 = Synth 2
 */
export function buildReplaceCurrentPatch(patchData, channel = SYNTH_TRACK_1) {
  return [...buildHeader(CMD_REPLACE_CURRENT_PATCH, channel), ...patchData, 0xF7]
}

/**
 * Build an array of 64 SysEx patch dump messages for a full bank.
 */
export function buildBankDump(patches, channel = SYNTH_TRACK_1) {
  return patches.map(p => buildReplaceCurrentPatch(p, channel))
}
