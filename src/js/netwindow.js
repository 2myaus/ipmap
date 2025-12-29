import {} from "./globals.js"

/** @type {Object.<Host, HTMLElement>} */
let hostMap = [];

const svgwindow = document.querySelector('#net-window .net-window-svg');
const hostsWindow = document.querySelector('#net-window .hosts');

/**
 * check whether a given host is in the LAN
 * @param {Host} host
 */
export async function isLAN(host) {
  const hostSplit = host.split('.');
  return (
    hostSplit[0] == "10" ||
    (hostSplit[0] == "192" && hostSplit[1] == "168") ||
    (
      hostSplit[0] == "172" &&
      parseInt(hostSplit[1]) >= 16 &&
      parseInt(hostSplit[1]) <= 31
    )
  );
}

/**
 * draw a host on the visual map
 * @param {Host} host
 */
export async function drawHost(host) {
  const position = await hostToPosition(host);

  if(hostMap[host]) return;
  const hostElement = document.createElement('div');
  hostMap[host] = hostElement;

  hostElement.classList.add('host');
  if (await isLAN(host)) {
    hostElement.classList.add('lan')
  }
  hostElement.setAttribute('title', host);
  hostElement.style.setProperty('--x-pos', position.x * 100);
  hostElement.style.setProperty('--y-pos', position.y * 100);

  hostsWindow.appendChild(hostElement);
}

/**
 * draw a packet event on the visual map
 * @param {Packet} packet
 */
export async function drawPacket(packet) {

  if (!hostMap[packet.src]) {
    await drawHost(packet.src);
  }
  if (!hostMap[packet.dst]) {
    await drawHost(packet.dst);
  }
  const srcElem = hostMap[packet.src];
  const dstElem = hostMap[packet.dst];

  const packetElement = document.createElementNS(svgwindow.getAttribute('xmlns'), 'line');

  packetElement.classList.add('packet');
  packetElement.setAttribute('ts', packet.timestamp);
  packetElement.setAttribute('x1', srcElem.style.getPropertyValue("--x-pos")+"%");
  packetElement.setAttribute('y1', srcElem.style.getPropertyValue("--y-pos")+"%");
  packetElement.setAttribute('x2', dstElem.style.getPropertyValue("--x-pos")+"%");
  packetElement.setAttribute('y2', dstElem.style.getPropertyValue("--y-pos")+"%");

  svgwindow.prepend(packetElement);

  setTimeout(() => {
    packetElement.remove()
  }, 10000);
}

/**
 * turn any given host into a random set of x-y coordinates in range [0, 1)
 * with special considerations for lan/localhost
 * @param {Host} host
 * @returns {Promise<{x: number, y: number}>}
 */
async function hostToPosition(host) {
  let pos = await stringToPosition(host);

  if (await isLAN(host)) {
    return {
      x: pos.x * 0.1 + 0.45,
      y: pos.y * 0.1 + 0.45
    }
  }
  return {
    x: (pos.x >= 0.4 && pos.x < 0.5) ? 0.4 : (pos.x >= 0.5 && pos.x < 0.6) ? 0.6 : pos.x,
    y: (pos.y >= 0.4 && pos.y < 0.5) ? 0.4 : (pos.y >= 0.5 && pos.y < 0.6) ? 0.6 : pos.y
  }
}

/**
 * hash any given string into a set of x-y coordinates in range [0, 1)
 * @param {string} inputString
 * @returns {Promise<{x: number, y: number}>}
 */
async function stringToPosition(inputString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const dv = new DataView(hashBuffer);
  return { x: dv.getUint16(0) / 65536, y: dv.getUint16(1) / 65536 };
}

