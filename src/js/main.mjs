import { invoke, listen } from "./globals.mjs";
import { initControls } from "./controls.mjs";
import { drawPacket, isLAN } from "./netwindow.mjs";

/** @import { Packet, Hop } from "./globals.mjs"; */

/** @type {[Packet]} */
let packetCache = [];

listen('new_packet', async (event) => {
  /** @type {Packet} */
  const packet = event.payload;
  await captureNewPacket(packet);
});

/**
 * handle a new packet
 * @param {Packet} packet
 */
async function captureNewPacket(packet) {
  packetCache.push(packet);
  await drawPacket(packet);
}

document.addEventListener("DOMContentLoaded", initControls);
