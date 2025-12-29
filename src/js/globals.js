/** @async @function */
export const invoke = window.__TAURI__.core.invoke;

/** @function */
export const listen = window.__TAURI__.event.listen;

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
