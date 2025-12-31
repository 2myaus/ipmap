import { ip_to_domain } from "./commands";
import type { IP } from "./globals";

let trackedNodes = new Map<IP,NodeInfo>();

//* Get the node-info for a specific ip, starting to track it
export function getNodeInfo(ip:IP){
  let node = trackedNodes.get(ip);

  if(!node){
    node = new NodeInfo(ip);
    trackedNodes.set(ip, node);
  }

  return node;
}

export class NodeInfo {
  readonly ip: IP;
  private _domain?: string;
  private _resolvedDomain = false;

  constructor(ip: IP) {
    this.ip = ip;
  }

  //* Resolve a domain from this node's ip and assign it to this node
  async resolveDomain(){
    this._domain = await ip_to_domain(this.ip);
  }

  async getDomain(){
    if(!this._resolvedDomain) await this.resolveDomain();
    return this._domain;
  }
}

