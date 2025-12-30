
/** @async @function */
export const invoke = window.__TAURI__.core.invoke;

/** @function */
export const listen = window.__TAURI__.event.listen;

/**
 * an object representing an IP address
 * @typedef {string} IP - the IPV4 or IPV6 address as a string
 */

/**
 * an object representing a transmission hop between two hosts
 * @typedef {Object} Hop
 * @property {IP} from
 * @property {IP} to
 * @property {boolean} hasUnknownIntermediates - whether there are unknown hosts/hops between these hosts
 * @property {boolean} isBroadcast
 */

/**
 * an object representing an end-to-end packet transmission between a source and destination host
 * @typedef {Object} Packet
 * @property {Host} src
 * @property {Host} dst
 * @property {Date} timestamp
 */

/**
 * an object representing a network interface device
 * @typedef {Object} Device
 * @property {string?} desc
 * @property {string} name
 * @property {[{
 *   addr:IP, netmask:IP?, broadcast_addr:IP?, dst_addr:IP?
 * }]} addresses
 * @property {{
 *   connection_status: boolean,
 *   if_flags: {loopback: boolean, up: boolean, running: boolean, wireless: boolean}
 * }} flags
 */
