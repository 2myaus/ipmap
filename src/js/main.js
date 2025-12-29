import { invoke, listen } from "./globals.js";
import { initControls } from "./controls.js";
import { drawHost, drawPacket, isLAN } from "./netwindow.js";

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
