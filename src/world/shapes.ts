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

const CELL = 1.0;

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
 * Inset door panels — the recognizable parts of a real door.
 * Composed of three separate geometries (body, raised panels, knob)
 * so DoorDetails in BlockInstances can render each with its own material.
 *
 * Layered front-to-back inside the timber panel block (which is 0.2 deep):
 *   - door body at z ≈ +0.08 (sits in front of the frame interior)
 *   - raised inset panels at z ≈ +0.105 (read as raised trim on the door)
 *   - brass knob at z ≈ +0.14 (visibly protrudes past the wall)
 */
export function doorBodyGeometry(): THREE.BufferGeometry {
  // Dark wood door surface — fills most of the frame but leaves a clear
  // lintel above and slim jambs on the sides.
  const g = box(CELL * 0.7, CELL * 0.86, CELL * 0.04, -CELL * 0.04);
  g.translate(0, 0, CELL * 0.08);
  return g;
}

/** Two raised inset panels — classic paneled-door look (top + bottom). */
export function doorPanelsGeometry(): THREE.BufferGeometry {
  const top = box(CELL * 0.5, CELL * 0.28, CELL * 0.025, CELL * 0.14);
  const bot = box(CELL * 0.5, CELL * 0.28, CELL * 0.025, -CELL * 0.22);
  top.translate(0, 0, CELL * 0.105);
  bot.translate(0, 0, CELL * 0.105);
  return mergeGeoms(top, bot);
}

/** Brass knob — protrudes from the right edge of the door. */
export function doorKnobGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(CELL * 0.055, 10, 8);
  g.translate(CELL * 0.22, -CELL * 0.05, CELL * 0.14);
  return g;
}

/**
 * Window glass pane — a generous square of glass, slightly recessed
 * inside the timber frame so the wood reads around the edges.
 */
export function windowPaneGeometry(): THREE.BufferGeometry {
  const g = box(CELL * 0.7, CELL * 0.7, CELL * 0.04, 0);
  g.translate(0, 0, CELL * 0.075);
  return g;
}

/**
 * A few thin green blades that sit on top of a grass slab, giving it
 * texture from a distance. Three small boxes at fixed offsets so the
 * pattern reads as deliberate clumps not noise.
 */
export function grassTuftsGeometry(): THREE.BufferGeometry {
  const blade = (x: number, z: number, h = CELL * 0.22) =>
    box(CELL * 0.07, h, CELL * 0.07, -CELL * 0.34 + h / 2)
      .translate(x, 0, z);

  const a = blade(-CELL * 0.22, -CELL * 0.18, CELL * 0.26);
  const b = blade(CELL * 0.18, -CELL * 0.12, CELL * 0.2);
  const c = blade(CELL * 0.04, CELL * 0.24, CELL * 0.24);
  const arr = (g: THREE.BufferGeometry) => g.attributes.position.array as Float32Array;
  const ap = arr(a), bp = arr(b), cp = arr(c);
  const merged = new Float32Array(ap.length + bp.length + cp.length);
  merged.set(ap, 0);
  merged.set(bp, ap.length);
  merged.set(cp, ap.length + bp.length);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(merged, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Window cross mullion — one horizontal + one vertical bar in front of
 * the glass, splitting it into 4 panes. Thin (~5% of cell) so the glass
 * still reads as glass, not as a wall of wood.
 */
export function windowCrossGeometry(): THREE.BufferGeometry {
  const horiz = box(CELL * 0.72, CELL * 0.05, CELL * 0.04, 0);
  const vert  = box(CELL * 0.05, CELL * 0.72, CELL * 0.04, 0);
  horiz.translate(0, 0, CELL * 0.105);
  vert.translate(0, 0, CELL * 0.105);
  return mergeGeoms(horiz, vert);
}

/**
 * Merge multiple BufferGeometries into one non-indexed geometry.
 * BoxGeometry is indexed by default; if you concatenate its raw position
 * array without indices you render garbage triangles. toNonIndexed()
 * expands the vertices first so the merged result is renderable.
 */
function mergeGeoms(...geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let total = 0;
  const expanded = geoms.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g;
    total += (ng.attributes.position.array as Float32Array).length;
    return ng;
  });
  const positions = new Float32Array(total);
  let offset = 0;
  for (const g of expanded) {
    const arr = g.attributes.position.array as Float32Array;
    positions.set(arr, offset);
    offset += arr.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  out.computeVertexNormals();
  return out;
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
