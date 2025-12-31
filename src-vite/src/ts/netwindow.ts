import type { Hop, IP, Packet } from "./globals";
import { deviceHasAddress } from "./globals";
import { getSelectedDevice } from "./controls";
import { getNodeInfo } from "./nodeinfo";


import * as ipaddr from "ipaddr.js";

let nodeMap: Map<IP, HTMLElement> = new Map();

const svgWindow: HTMLElement = document.querySelector('#net-window .net-window-svg')!;
const nodesWindow: HTMLElement = document.querySelector('#net-window .nodes')!;

let showDomains = false;
export function setShowDomains(show: boolean) {
  showDomains = show;
  reDrawNodes();
}

async function reDrawNodes() {
  Array.from(nodeMap.entries()).forEach(([ip, oldElem]) => {
    nodeMap.delete(ip);
    drawNode(ip);
    oldElem.remove();
  });
}

export async function selectNode(ip: IP){
  const nodeElement = nodeMap.get(ip);
  if (!nodeElement) return;
  nodesWindow.querySelectorAll('.selected').forEach(e => {
    e.classList.remove('selected');
  });
  nodeElement.classList.add('selected');
}

//* draw an ip on the visual map
export async function drawNode(ip: IP) {
  const position = await ipToPosition(ip);

  if (nodeMap.has(ip)) return;

  const nodeInfo = getNodeInfo(ip);

  const ipElement = document.createElement('div');
  ipElement.style.setProperty('--x-pos', `${position.x * 100}`);
  ipElement.style.setProperty('--y-pos', `${position.y * 100}`);

  ipElement.classList.add('node');

  const ipRange = ipaddr.parse(ip).range()
  const device = getSelectedDevice();

  if (ip.includes(':')) {
    ipElement.classList.add('ipv6');
  }

  if (device && deviceHasAddress(device, ip)) {
    ipElement.classList.add('localhost');
  }
  else if (ipRange == "private") {
    ipElement.classList.add('lan')
  }

  const ipColor = ipToColor(ip);
  ipElement.style.setProperty('--ip-color', `rgb(${ipColor.r}, ${ipColor.g}, ${ipColor.b})`);

  ipElement.setAttribute('title', ip);
  nodeMap.set(ip, ipElement);

  if (showDomains) {
    const domain = await nodeInfo.getDomain();
    if(domain) ipElement.setAttribute('title', `${domain} (${ip})`);
  }

  ipElement.addEventListener('click', () => {
    selectNode(ip);
  });

  nodesWindow.appendChild(ipElement);
}

//* draw a hop event on the visual map
export async function drawPacket(packet: Packet) {
  const hop: Hop = {
    from: packet.src,
    to: packet.dst,
    hasUnknownIntermediates: true,
    isBroadcast: false,
    isMulticast: ipaddr.parse(packet.dst).range() == "multicast"
  };

  await drawHop(hop);
}

function randRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

//* draw a hop event on the visual map
async function drawHop(hop: Hop) {
  const device = getSelectedDevice();
  if (device) {
    let anyBroadcast = false;

    device.addresses.forEach(a => {
      if (hop.to != a.broadcast_addr && ipaddr.parse(hop.to).range() != "broadcast") return;
      anyBroadcast = true;

      drawHop({
        from: hop.from,
        to: a.addr,
        hasUnknownIntermediates: hop.hasUnknownIntermediates,
        isBroadcast: true,
        isMulticast: false
      });
    })

    if (anyBroadcast) return;
  }
  if (!nodeMap.has(hop.from)) {
    await drawNode(hop.from);
  }
  if (!nodeMap.has(hop.to)) {
    await drawNode(hop.to);
  }

  const srcElem = nodeMap.get(hop.from)!;
  const dstElem = nodeMap.get(hop.to)!;

  const ns = svgWindow.getAttribute("xmlns");
  const hopElement = document.createElementNS(ns, 'line');

  hopElement.classList.add('hop');
  if (hop.hasUnknownIntermediates) hopElement.classList.add('unknown-intermediates');
  if (hop.isBroadcast) hopElement.classList.add('broadcast');
  if (hop.isMulticast) hopElement.classList.add('multicast');

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
  hopElement.setAttribute("pathLength", '100');

  svgWindow.prepend(hopElement);

  setTimeout(() => {
    hopElement.remove()
  }, 10000);
}

//* turn any given ip into a random set of x-y coordinates in range [0, 1) with special considerations for lan
async function ipToPosition(ip: IP): Promise<{ x: number, y: number }> {
  const device = getSelectedDevice();
  let pos = await stringToPosition(ip);

  if (ipaddr.parse(ip).range() == "private" || (device && deviceHasAddress(device, ip))) {
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

//* hash any given string into a set of x-y coordinates in range [0, 1)
async function stringToPosition(input:string): Promise<{ x: number, y: number }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const dv = new DataView(hashBuffer);
  return { x: dv.getUint16(0) / 65536, y: dv.getUint16(1) / 65536 };
}

function ipToColor(ip:IP){
  const octets = ipaddr.parse(ip).toByteArray();
  if(octets.length == 16){
    const oc1 = octets.slice(0, 5).reduce((p, c) => {return p+c;}) / (256*5);
    const oc2 = octets.slice(5, 10).reduce((p, c) => {return p+c;}) / (256*5);
    const oc3 = octets.slice(10, 16).reduce((p, c) => {return p+c;}) / (256*6);

    return HSVtoRGB(oc1, oc2, oc3);
  }
  return HSVtoRGB(
    (octets[0] + octets[1]) / 512,
    octets[3] / 512 + 0.5,
    octets[2] / 512 + 0.5
  );
}

//* Convert HSV [0, 1] color to RGB [0, 255]
function HSVtoRGB(h:number, s:number, v:number) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r! * 255),
        g: Math.round(g! * 255),
        b: Math.round(b! * 255)
    };
}
