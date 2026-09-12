import ts from 'typescript';
import { Marker, normalizeNode } from './normalize.js';
import { CodeUnit } from './units.js';

export interface Fingerprint {
  set: Set<string>;
  nodeCount: number;
}

export function serialize(marker: Marker): string {
  if (marker.children === undefined || marker.children.length === 0) {
    return marker.tag;
  }
  return `${marker.tag}(${marker.children.map(serialize).join(' ')})`;
}

export function fingerprintUnit(unit: CodeUnit): Fingerprint {
  const fn = unit.node as ts.FunctionLikeDeclaration;
  const body = fn.body ?? unit.node;
  const marker = normalizeNode(body);
  const set = new Set<string>();
  collect(marker, set);
  return { set, nodeCount: countNodes(marker) };
}

function collect(marker: Marker, set: Set<string>): void {
  set.add(serialize(marker));
  for (const child of marker.children ?? []) {
    collect(child, set);
  }
}

function countNodes(marker: Marker): number {
  return 1 + (marker.children ?? []).reduce((sum, child) => sum + countNodes(child), 0);
}
