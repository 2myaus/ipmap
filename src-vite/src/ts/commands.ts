import type { Device, IP } from "./globals";
import { invoke } from "@tauri-apps/api/core";

export async function start_capture() {
  await invoke('start_capture');
}
export async function stop_capture() {
  await invoke('stop_capture');
}
export async function set_capture_device(deviceName: string) {
  await invoke('set_capture_device', { name: deviceName });
}
export async function get_devices(): Promise<Device[]> {
  return await invoke('get_devices');
}
export async function domain_to_ips(domain: string) : Promise<IP[]> {
  return await invoke('domain_to_ips', { domain: domain });
}
export async function ip_to_domain(ip: IP) : Promise<string | undefined> {
  try {
    return await invoke('ip_to_domain', { ip: ip });
  }
  catch (e) {
    console.warn(e);
  }
}


