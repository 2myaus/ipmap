import { get_devices, set_capture_device, start_capture, stop_capture } from './commands';
import type { Device } from './globals';
import {  setShowDomains } from "./netwindow";

let devices:Device[] = [];
let selectedDevice:Device | undefined;

export function getSelectedDevice(){
  return selectedDevice;
}

export async function initControls() {
  const deviceList = document.querySelector('#control #device-select') as HTMLSelectElement;
  const toggleCaptureButton = document.querySelector('#control #toggle-capture') as HTMLInputElement;
  const getDevicesButton = document.querySelector('#control #device-get') as HTMLButtonElement;
  const showDomainsCheckbox = document.querySelector("#control #show-domains") as HTMLInputElement;


  getDevicesButton.addEventListener('click', async () => {
    devices = await get_devices();

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

    await set_capture_device(deviceName);
    selectedDevice = devices.find(dev => (
      dev.name == deviceName
    ));
  }

  showDomainsCheckbox.addEventListener('change', async () => {
    setShowDomains(showDomainsCheckbox.checked);
  });

  let capturing = false;
  toggleCaptureButton.addEventListener('click', async () => {
    if (capturing) {
      await stop_capture();
      capturing = false
      deviceList.disabled = false;
    }
    else {
      await start_capture();
      capturing = true;
      deviceList.disabled = true;
    }
    toggleCaptureButton.innerText = capturing ? "stop capture" : "start capture";
  });
}
