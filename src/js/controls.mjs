import { invoke } from "./globals.mjs"
import { setShowDomains } from "./netwindow.mjs";

/** @import { Device } from "./globals.mjs"; */

export async function initControls() {
  /** @type {HTMLSelectElement} */
  const deviceList = document.querySelector('#control #device-select');
  /** @type {HTMLInputElement} */
  const toggleCaptureButton = document.querySelector('#control #toggle-capture');
  /** @type {HTMLButtonElement} */
  const getDevicesButton = document.querySelector('#control #device-get');
  /** @type {HTMLButtonElement} */
  const showDomainsButton = document.querySelector("#control #show-domains");

  getDevicesButton.addEventListener('click', async () => {
    /** @type {[Device]} */
    const devices = await invoke('get_devices');

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
    await invoke('set_capture_device', { name: deviceList.value });
  }

  showDomainsButton.addEventListener('change', async () => {
    setShowDomains(showDomainsButton.checked);
  });

  let capturing = false;
  toggleCaptureButton.addEventListener('click', async () => {
    if (capturing) {
      invoke('stop_capture');
      capturing = false
    }
    else {
      await invoke('start_capture');
      capturing = true;
    }
    toggleCaptureButton.innerText = capturing ? "stop capture" : "start capture";
  });
}
