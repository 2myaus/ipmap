/** @async @function */
export const invoke = window.__TAURI__.core.invoke;

/** @function */
export const listen = window.__TAURI__.event.listen;

/**
 * an object representing a network host
 * @typedef {Object} Host
 * @property {IP} ip
 * @property {string?} domain - the domain of the host, or null
 */

/**
 * an object representing an IP address
 * @typedef {string} IP - the IPV4 or IPV6 address as a string
 */

/**
 * an object representing a transmission hop between two hosts
 * @typedef {Object} Hop
 * @property {Host} from
 * @property {Host} to
 * @property {boolean} hasUnknownIntermediates - whether there are unknown hosts/hops between these hosts
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
