/** @function */
const invoke = window.__TAURI__.core.invoke;

/** @function */
const listen = window.__TAURI__.event.listen;

/**
 * an object representing a network host
 * @typedef {Object} Host
 * @property {string} ip - the IPV4 or IPV6 address
 * @property {string?} domain - the domain of the host, or null
 */

/**
 * an object representing a transmission hop between two hosts
 * @typedef {Object} Hop
 * @property {Host} from
 * @property {Host} to
 * @property {boolean} hasUnknownIntermediates - whether there are unknown hosts/hops between these hosts
 */

/**
 * an object representing the end-to-end route (as hops) between two hosts
 * @typedef {Object} Route
 * @property {[Hop]} hops
 * @property {Date} lastChecked - when this route was last checked (i.e with traceroute)
 */

/**
 * an object representing an end-to-end packet transmission between a source and destination host
 * @typedef {Object} Packet
 * @property {Host} src
 * @property {Host} dst
 * @property {Date} timestamp
 */


/** @type {[Packet]} */
let packetCache = [];

/**
 * handle a new packet
 * @param {Packet} packet
 */
function catchNewPacket(packet){
 packetCache.push(packet);
 console.log(packet);
}

listen('new-packet', (event) => {
 /** @type {Packet} */
 const packet = event.payload;
 catchNewPacket(packet);
});


/**
 * hash any given string into a set of x-y coordinates in range [0, 1)
 * @param {string} inputString
 * @returns {Promise<{number, number}>}
 */
async function stringToPosition(inputString) {
 const encoder = new TextEncoder();
 const data = encoder.encode(inputString);
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 const dv = new DataView(hashBuffer);
 return { x: dv.getUint16(0) / 65536, y: dv.getUint16(1) / 65536 };
}
