//* an object representing an IP address
export type IP = string;

//* an object representing a transmission hop between two hosts
export type Hop = {
  from: IP,
  to: IP,
  hasUnknownIntermediates: boolean, // whether there are unknown hosts/hops between these hosts
  isBroadcast: boolean
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
  addresses: [{
    addr: IP,
    netmask?: IP,
    broadcast_addr?: IP,
    dst_addr?: IP
  }],
  flags: {
    connection_status: boolean,
    if_flags: {
      loopback: boolean,
      up: boolean,
      running: boolean,
      wireless: boolean
    }
  }
};
