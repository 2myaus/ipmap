import { invoke } from "./globals.js"
/** @import { Device } from "./globals.js"; */

export async function initControls() {
  /** @type {HTMLSelectElement} */
  const deviceList = document.querySelector('#control #device-select');
  const toggleCaptureButton = document.querySelector('#control #toggle-capture')

  document.querySelector('#control #device-get').addEventListener('click', async () => {
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

  async function deviceListChange() {
    await invoke('set_capture_device', { name: deviceList.value });
  };
  deviceList.addEventListener('change', deviceListChange);

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
