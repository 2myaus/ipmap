/** @import { Packet, Hop, Host} from "./globals.js"; */

/** @type {Object.<Host, HTMLElement>} */
let hostMap = [];

const svgWindow = document.querySelector('#net-window .net-window-svg');
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

  if (hostMap[host]) return;
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
 * draw a hop event on the visual map
 * @param {Packet} packet
 */
export async function drawPacket(packet) {
  /** @type Hop */
  const hop = {
    from: packet.src,
    to: packet.dst,
    hasUnknownIntermediates: true
  };

  await drawHop(hop);
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * draw a hop event on the visual map
 * @param {Hop} hop
 */
async function drawHop(hop) {

  if (!hostMap[hop.from]) {
    await drawHost(hop.from);
  }
  if (!hostMap[hop.to]) {
    await drawHost(hop.to);
  }
  /** @type HTMLElement */
  const srcElem = hostMap[hop.from];
  /** @type HTMLElement */
  const dstElem = hostMap[hop.to];

  const ns = svgWindow.getAttribute("xmlns");
  const hopElement = document.createElementNS(ns, 'line');

  hopElement.classList.add('hop');
  if(hop.hasUnknownIntermediates) hopElement.classList.add('unknown-intermediates');

  // Randomized offsets:
  const maxRx = srcElem.offsetWidth * 10 / hostsWindow.offsetWidth;
  const maxRy = srcElem.offsetHeight * 10 / hostsWindow.offsetHeight;

  const theta1 = randRange(0, 2*Math.PI);
  const x1 = Math.cos(theta1)*randRange(0, maxRx);
  const y1 = Math.sin(theta1)*randRange(0, maxRy);


  hopElement.setAttribute('x1', (parseInt(srcElem.style.getPropertyValue("--x-pos")) + x1) + "%");
  hopElement.setAttribute('y1', (parseInt(srcElem.style.getPropertyValue("--y-pos")) + y1) + "%");
  hopElement.setAttribute('x2', dstElem.style.getPropertyValue("--x-pos") + "%");
  hopElement.setAttribute('y2', dstElem.style.getPropertyValue("--y-pos") + "%");
  hopElement.setAttribute("pathLength", 100);

  svgWindow.prepend(hopElement);

  setTimeout(() => {
    hopElement.remove()
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

