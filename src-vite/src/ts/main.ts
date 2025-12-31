import type { Packet } from "./globals";
import { listen } from "@tauri-apps/api/event";
import { initControls } from "./controls";
import { drawPacket } from "./netwindow";

let packetCache:Packet[] = [];

listen('new_packet', async (event) => {
  const packet = event.payload as Packet;
  await captureNewPacket(packet);
});

async function captureNewPacket(packet:Packet) {
  packetCache.push(packet);
  await drawPacket(packet);
}

document.addEventListener("DOMContentLoaded", initControls);
