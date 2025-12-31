import * as ipaddr from "ipaddr.js";
//* an object representing an IP address
export type IP = string;

//* an object representing a transmission hop between two hosts
export type Hop = {
  from: IP,
  to: IP,
  hasUnknownIntermediates: boolean, // whether there are unknown hosts/hops between these hosts
  isBroadcast: boolean,
  isMulticast: boolean
};

//* an object representing an end-to-end packet transmission between a source and destination host
export type Packet = {
  src: IP,
  dst: IP,
  timestamp: Date // whether there are unknown hosts/hops between these hosts
};

//* an object representing a network interface device
export type Device = {
  name: string,
  desc?: string,
  addresses: {
    addr: IP,
    netmask?: IP,
    broadcast_addr?: IP,
    dst_addr?: IP
  }[],
  flags: {
    connection_status: boolean,
    if_flags: {
      loopback: boolean,
      up: boolean,
      running: boolean,
      wireless: boolean
    }
  }
}
export function deviceHasAddress(device: Device, ip: IP): boolean {
  const formattedIP = ipaddr.parse(ip).toString();
  return device.addresses.findIndex(a => (ipaddr.parse(a.addr).toString() == formattedIP)) != -1;
}
export function hasBroadcastAddress(device: Device, ip: IP): boolean {
  const formattedIP = ipaddr.parse(ip).toString();
  return device.addresses.findIndex(a => (a.broadcast_addr && ipaddr.parse(a.broadcast_addr).toString() == formattedIP)) != -1;
}
