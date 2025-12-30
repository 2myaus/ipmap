import { invoke } from "./globals.mjs";

/** @import { Packet, Hop, IP, Device } from "./globals.mjs"; */

/** @type {Map<string, HTMLElement>} */
let nodeMap = new Map();

const svgWindow = document.querySelector('#net-window .net-window-svg');
const nodesWindow = document.querySelector('#net-window .nodes');

let showDomains = false;
export function setShowDomains(show) {
  showDomains = show == true; // ensure a bool
  reDrawNodes();
}

/** @type {Device?} */
let device;
/** @param {Device?} dev */
export function setDevice(dev){
  device = dev;
}

/**
 * check whether a given IP is in the LAN
 * @param {IP} ip
 */
export async function isLAN(ip) {

  // TODO: IPV6
  if (ip.includes(':')) return false;

  const ipSplit = ip.split('.');
  return (
    ipSplit[0] == "10" ||
    (ipSplit[0] == "192" && ipSplit[1] == "168") ||
    (
      ipSplit[0] == "172" &&
      parseInt(ipSplit[1]) >= 16 &&
      parseInt(ipSplit[1]) <= 31
    )
  );
}

async function reDrawNodes() {
  Array.from(nodeMap.entries()).forEach(([ip, oldElem]) => {
    nodeMap.delete(ip);
    drawNode(ip);
    oldElem.remove();
  });
}

/**
 * draw an ip on the visual map
 * @param {IP} ip
 */
export async function drawNode(ip) {
  const position = await ipToPosition(ip);

  if (nodeMap.has(ip)) return;
  
  const ipElement = document.createElement('div');
  ipElement.style.setProperty('--x-pos', position.x * 100);
  ipElement.style.setProperty('--y-pos', position.y * 100);

  ipElement.classList.add('node');
  if(device && device.addresses.find(addr => (
    addr.addr == ip
  ))) {
    ipElement.classList.add('localhost');
  }
  else if (await isLAN(ip)) {
    ipElement.classList.add('lan')
  }
  ipElement.setAttribute('title', ip);
  nodeMap.set(ip, ipElement);

  if (showDomains) {
    try {
      const domain = await invoke('ip_to_domain', { ip: ip });
      ipElement.setAttribute('title', `${domain} (${ip})`);
    } catch (e) { console.warn(e); }
  }

  nodesWindow.appendChild(ipElement);
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
  if(device){
    let anyBroadcast = false;

    device.addresses.forEach(a=> {
      if(hop.to != a.broadcast_addr) return;
      anyBroadcast = true;

      drawHop({
        from: hop.from,
        to: a.addr,
        hasUnknownIntermediates: hop.hasUnknownIntermediates
      });
    })

    if(anyBroadcast) return;
  }
  if (!nodeMap.has(hop.from)) {
    await drawNode(hop.from);
  }
  if (!nodeMap.has(hop.to)) {
    await drawNode(hop.to);
  }
  /** @type HTMLElement */
  const srcElem = nodeMap.get(hop.from);
  /** @type HTMLElement */
  const dstElem = nodeMap.get(hop.to);

  const ns = svgWindow.getAttribute("xmlns");
  const hopElement = document.createElementNS(ns, 'line');

  hopElement.classList.add('hop');
  if (hop.hasUnknownIntermediates) hopElement.classList.add('unknown-intermediates');

  // Randomized offsets:
  const maxRx = srcElem.offsetWidth * 10 / nodesWindow.offsetWidth;
  const maxRy = srcElem.offsetHeight * 10 / nodesWindow.offsetHeight;

  const theta1 = randRange(0, 2 * Math.PI);
  const x1 = Math.cos(theta1) * randRange(0, maxRx);
  const y1 = Math.sin(theta1) * randRange(0, maxRy);


  hopElement.setAttribute('x1', `${parseInt(srcElem.style.getPropertyValue("--x-pos")) + x1}%`);
  hopElement.setAttribute('y1', `${parseInt(srcElem.style.getPropertyValue("--y-pos")) + y1}%`);
  hopElement.setAttribute('x2', `${dstElem.style.getPropertyValue("--x-pos")}%`);
  hopElement.setAttribute('y2', `${dstElem.style.getPropertyValue("--y-pos")}%`);
  hopElement.setAttribute("pathLength", 100);

  svgWindow.prepend(hopElement);

  setTimeout(() => {
    hopElement.remove()
  }, 10000);
}

/**
 * turn any given ip into a random set of x-y coordinates in range [0, 1)
 * with special considerations for lan/localip
 * @param {IP} ip
 * @returns {Promise<{x: number, y: number}>}
 */
async function ipToPosition(ip) {
  let pos = await stringToPosition(ip);

  if (await isLAN(ip)) {
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

