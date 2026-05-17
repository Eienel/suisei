import * as THREE from 'three';
import type { BlockShape } from '@/types';

/**
 * Block geometry variants. Each occupies one grid cell but fills it
 * differently — turning plain voxels into architecture (slabs for
 * floors/roads, poles for lamp-posts/pillars, panels for walls,
 * ramps for roofs).
 *
 * All geometries are authored to sit inside the unit cell with their
 * base at y = -0.5 (so a slab lies on the ground, a pole stands up).
 */

const CELL = 0.94; // slightly under 1 so neighbours read as separate bricks

export interface ShapeDef {
  id: BlockShape;
  label: string;
  /** Builds the THREE geometry. Memoized by the caller. */
  build: () => THREE.BufferGeometry;
}

/** Box centred in-cell. */
function box(w: number, h: number, d: number, yOffset = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, yOffset, 0);
  return g;
}

/** Triangular-prism wedge — flat bottom, vertical back (-z), sloped top. */
function wedge(): THREE.BufferGeometry {
  const h = CELL / 2;
  const w = CELL / 2;
  const d = CELL / 2;
  // 6 unique vertices
  const v = [
    [-w, -h, -d], // 0 bottom back left
    [w, -h, -d], //  1 bottom back right
    [w, -h, d], //   2 bottom front right
    [-w, -h, d], //  3 bottom front left
    [-w, h, -d], //  4 top back left
    [w, h, -d], //   5 top back right
  ];
  const tri = (a: number, b: number, c: number) => [...v[a], ...v[b], ...v[c]];
  const positions = new Float32Array([
    ...tri(0, 1, 2), ...tri(0, 2, 3), // bottom
    ...tri(0, 5, 1), ...tri(0, 4, 5), // back wall
    ...tri(3, 2, 5), ...tri(3, 5, 4), // sloped top
    ...tri(0, 3, 4), //                 left triangle
    ...tri(1, 5, 2), //                 right triangle
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Tree canopy — chunky icosahedron that reads as leafy from far away
 * but stays low-poly. Rendered with a separate trunk mesh in
 * BlockInstances so the colours don't bleed.
 */
function canopy(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(CELL * 0.42, 0);
  g.translate(0, CELL * 0.18, 0); // sit above the trunk
  return g;
}

/** Tree trunk — narrow brown cylinder, slightly off the ground. */
export function trunkGeometry(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(CELL * 0.11, CELL * 0.14, CELL * 0.65, 8);
  g.translate(0, -CELL * 0.18, 0); // base at -0.5, top meets the canopy
  return g;
}

/**
 * Inset door panel — a darker plank that sits inside a timber frame.
 * 60% wide, 85% tall, pushed forward 0.06 so it reads as a real door
 * recessed into the wall. Used by the door block's overlay render.
 */
export function doorPanelGeometry(): THREE.BufferGeometry {
  return box(CELL * 0.6, CELL * 0.85, CELL * 0.04, -CELL * 0.04);
}

/** Tiny brass knob — sits on the right edge of the door panel. */
export function doorKnobGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(CELL * 0.045, 8, 8);
  g.translate(CELL * 0.22, -CELL * 0.05, 0);
  return g;
}

/**
 * Window glass pane — sits inside a timber frame. Slightly bigger than
 * the door knob, slim, and a hair forward so the frame reads behind it.
 */
export function windowPaneGeometry(): THREE.BufferGeometry {
  return box(CELL * 0.55, CELL * 0.55, CELL * 0.05, CELL * 0.02);
}

/** Window cross bar (one horizontal + one vertical). Two thin boxes. */
export function windowCrossGeometry(): THREE.BufferGeometry {
  const horiz = box(CELL * 0.6, CELL * 0.06, CELL * 0.06, CELL * 0.02);
  const vert = box(CELL * 0.06, CELL * 0.6, CELL * 0.06, CELL * 0.02);
  // Merge by hand — both share the same vertex / index layout
  const a = horiz.attributes.position.array as Float32Array;
  const b = vert.attributes.position.array as Float32Array;
  const merged = new Float32Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(merged, 3));
  g.computeVertexNormals();
  return g;
}

export const SHAPES: Record<BlockShape, ShapeDef> = {
  cube: { id: 'cube', label: 'Cube', build: () => box(CELL, CELL, CELL) },
  slab: { id: 'slab', label: 'Slab', build: () => box(CELL, CELL * 0.32, CELL, -CELL * 0.34) },
  pole: { id: 'pole', label: 'Pole', build: () => box(CELL * 0.34, CELL, CELL * 0.34) },
  panel: { id: 'panel', label: 'Panel', build: () => box(CELL, CELL, CELL * 0.2) },
  ramp: { id: 'ramp', label: 'Ramp', build: () => wedge() },
  tree: { id: 'tree', label: 'Tree', build: () => canopy() },
};

export const SHAPE_LIST: readonly ShapeDef[] = Object.values(SHAPES);

/** Lazily-built, cached geometry per shape (geometries are immutable). */
const geometryCache = new Map<BlockShape, THREE.BufferGeometry>();

export function getShapeGeometry(shape: BlockShape | undefined): THREE.BufferGeometry {
  const key: BlockShape = shape ?? 'cube';
  let g = geometryCache.get(key);
  if (!g) {
    g = SHAPES[key].build();
    geometryCache.set(key, g);
  }
  return g;
}
