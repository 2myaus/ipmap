import type { Device } from './globals';
import { invoke } from '@tauri-apps/api/core';
import { setDevice, setShowDomains } from "./netwindow";

export async function initControls() {
  const deviceList = document.querySelector('#control #device-select') as HTMLSelectElement;
  const toggleCaptureButton = document.querySelector('#control #toggle-capture') as HTMLInputElement;
  const getDevicesButton = document.querySelector('#control #device-get') as HTMLButtonElement;
  const showDomainsCheckbox = document.querySelector("#control #show-domains") as HTMLInputElement;

  let devices:Device[] = [];

  getDevicesButton.addEventListener('click', async () => {
    devices = await invoke('get_devices');

    deviceList.innerHTML = '';

    devices.forEach((device) => {
      const deviceElement = document.createElement('option');
      deviceElement.innerText = device.name;
      deviceList.appendChild(deviceElement);
    })

    deviceListChange();
  });

  deviceList.addEventListener('change', deviceListChange);
  async function deviceListChange(){
    const deviceName = deviceList.value;

    await invoke('set_capture_device', { name: deviceName});
    setDevice(devices.find(dev => (
      dev.name == deviceName
    )));
  }

  showDomainsCheckbox.addEventListener('change', async () => {
    setShowDomains(showDomainsCheckbox.checked);
  });

  let capturing = false;
  toggleCaptureButton.addEventListener('click', async () => {
    if (capturing) {
      invoke('stop_capture');
      capturing = false
      deviceList.disabled = false;
    }
    else {
      await invoke('start_capture');
      capturing = true;
      deviceList.disabled = true;
    }
    toggleCaptureButton.innerText = capturing ? "stop capture" : "start capture";
  });
}
