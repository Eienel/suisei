import { Fragment, useMemo, type ReactNode } from 'react';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Block as BlockData, BlockShape, BlockType, Vec3 } from '@/types';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { getShapeGeometry, trunkGeometry } from '@/world/shapes';

interface Props {
  blocks: readonly BlockData[];
  selectedBlockId?: string | null;
  /** Optional placement raycasting — omitted by VisitPage. */
  onFaceHover?: (cell: Vec3) => void;
  onFaceClick?: (cell: Vec3, blockId: string) => void;
  /** Day/night phase 0..1 — drives emissive boost on emissive types. */
  nightFactor?: number;
}

/**
 * Renders ALL world blocks via batched <Instances> draw calls — one
 * per (type, shape) combo. Per-instance colour tint and per-instance
 * pointer events still work (drei wraps THREE.InstancedMesh and gives
 * each <Instance> first-class behaviour).
 *
 * This is the perf-and-expression unlock: you can have thousands of
 * blocks, varied shapes, varied colours, and still hit 60fps.
 */
export function BlockInstances({
  blocks,
  selectedBlockId = null,
  onFaceHover,
  onFaceClick,
  nightFactor = 0,
}: Props) {
  const groups = useMemo(() => groupByTypeShape(blocks), [blocks]);

  return (
    <Fragment>
      {groups.map((group) => (
        <BlockGroup
          key={group.key}
          type={group.type}
          shape={group.shape}
          blocks={group.blocks}
          selectedBlockId={selectedBlockId}
          onFaceHover={onFaceHover}
          onFaceClick={onFaceClick}
          nightFactor={nightFactor}
        />
      ))}
      {/* Selection outline drawn separately so we don't break instancing. */}
      {selectedBlockId && (
        <SelectionOutline
          block={blocks.find((b) => b.id === selectedBlockId) ?? null}
        />
      )}
    </Fragment>
  );
}

interface BlockGroup {
  key: string;
  type: BlockType;
  shape: BlockShape;
  blocks: BlockData[];
}

function groupByTypeShape(blocks: readonly BlockData[]): BlockGroup[] {
  const map = new Map<string, BlockGroup>();
  for (const b of blocks) {
    // Forward-compat: older saves stored foliage as a cube. Always
    // render it as a proper tree now so existing towns visibly upgrade.
    const rawShape = (b.shape ?? 'cube') as BlockShape;
    const shape: BlockShape =
      b.type === 'foliage' && (rawShape === 'cube' || rawShape === 'tree') ? 'tree' : rawShape;
    const k = `${b.type}__${shape}`;
    let g = map.get(k);
    if (!g) {
      g = { key: k, type: b.type, shape, blocks: [] };
      map.set(k, g);
    }
    g.blocks.push(b);
  }
  return Array.from(map.values());
}

function BlockGroup({
  type,
  shape,
  blocks,
  selectedBlockId,
  onFaceHover,
  onFaceClick,
  nightFactor = 0,
}: {
  type: BlockType;
  shape: BlockShape;
  blocks: BlockData[];
  selectedBlockId: string | null;
  onFaceHover?: (cell: Vec3) => void;
  onFaceClick?: (cell: Vec3, blockId: string) => void;
  nightFactor?: number;
}): ReactNode {
  const def = BLOCK_BY_ID[type];
  const geometry = useMemo(() => getShapeGeometry(shape), [shape]);

  const material = useMemo(() => makeMaterial(type, nightFactor), [type, nightFactor]);

  // Animated materials (water shimmer, AI neural pulse) — modulate
  // emissiveIntensity around the baseline each frame.
  useFrame((state) => {
    if (!def.animated && type !== 'water' && type !== 'ai_neural') return;
    const std = material as THREE.MeshStandardMaterial;
    const base = (std.userData.baseEmissive as number | undefined) ?? std.emissiveIntensity;
    if (std.userData.baseEmissive === undefined) std.userData.baseEmissive = base;
    const t = state.clock.elapsedTime;
    // Water = slow shimmer; AI = faster pulse
    const freq = type === 'water' ? 0.7 : 1.6;
    const amp = type === 'water' ? 0.35 : 0.25;
    std.emissiveIntensity = base * (1 + Math.sin(t * freq) * amp);
  });

  return (
    <Fragment>
      <Instances
        geometry={geometry}
        material={material}
        limit={Math.max(64, blocks.length * 2)}
      >
        {blocks.map((b) => (
          <BlockInstance
            key={b.id}
            block={b}
            defaultColor={def.color}
            selected={b.id === selectedBlockId}
            onFaceHover={onFaceHover}
            onFaceClick={onFaceClick}
          />
        ))}
      </Instances>
      {shape === 'tree' && (
        <TreeTrunks blocks={blocks} onFaceHover={onFaceHover} onFaceClick={onFaceClick} />
      )}
    </Fragment>
  );
}

/**
 * Renders brown trunks underneath every tree-shaped block. Trunks
 * have their own material so the foliage canopy's green doesn't bleed
 * into the trunk's brown. Trunks ignore per-instance colour tint —
 * a tree always has a brown trunk.
 */
function TreeTrunks({
  blocks,
  onFaceHover,
  onFaceClick,
}: {
  blocks: BlockData[];
  onFaceHover?: (cell: Vec3) => void;
  onFaceClick?: (cell: Vec3, blockId: string) => void;
}) {
  const geometry = useMemo(() => trunkGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#A0673A',
        roughness: 0.85,
        metalness: 0.05,
      }),
    [],
  );
  return (
    <Instances
      geometry={geometry}
      material={material}
      limit={Math.max(64, blocks.length * 2)}
    >
      {blocks.map((b) => (
        <Instance
          key={b.id + '-trunk'}
          position={b.position}
          rotation={b.rotation}
          onPointerMove={
            onFaceHover
              ? (e) => {
                  e.stopPropagation();
                  onFaceHover([b.position[0], b.position[1] + 1, b.position[2]]);
                }
              : undefined
          }
          onPointerDown={
            onFaceClick
              ? (e) => {
                  e.stopPropagation();
                  if (e.button !== 0) return;
                  onFaceClick([b.position[0], b.position[1] + 1, b.position[2]], b.id);
                }
              : undefined
          }
        />
      ))}
    </Instances>
  );
}

function BlockInstance({
  block,
  defaultColor,
  selected,
  onFaceHover,
  onFaceClick,
}: {
  block: BlockData;
  defaultColor: string;
  selected: boolean;
  onFaceHover?: (cell: Vec3) => void;
  onFaceClick?: (cell: Vec3, blockId: string) => void;
}) {
  const tint = block.color ?? defaultColor;
  const emissiveBoost = selected ? 1.0 : 0.0;

  const cellFromHit = (e: ThreeEvent<PointerEvent>): Vec3 => {
    const [bx, by, bz] = block.position;
    const lx = e.point.x - bx;
    const ly = e.point.y - by;
    const lz = e.point.z - bz;
    const ax = Math.abs(lx);
    const ay = Math.abs(ly);
    const az = Math.abs(lz);
    if (ax >= ay && ax >= az) return [bx + (Math.sign(lx) || 1), by, bz];
    if (ay >= ax && ay >= az) return [bx, by + (Math.sign(ly) || 1), bz];
    return [bx, by, bz + (Math.sign(lz) || 1)];
  };

  return (
    <Instance
      position={block.position}
      rotation={block.rotation}
      color={emissiveBoost > 0 ? lighten(tint, 0.3) : tint}
      onPointerMove={
        onFaceHover
          ? (e) => {
              e.stopPropagation();
              onFaceHover(cellFromHit(e));
            }
          : undefined
      }
      onPointerDown={
        onFaceClick
          ? (e) => {
              e.stopPropagation();
              if (e.button !== 0) return;
              onFaceClick(cellFromHit(e), block.id);
            }
          : undefined
      }
    />
  );
}

/** A subtle wireframe shell around the selected block, rendered separately. */
function SelectionOutline({ block }: { block: BlockData | null }) {
  if (!block) return null;
  return (
    <mesh position={block.position} rotation={block.rotation}>
      <boxGeometry args={[1.04, 1.04, 1.04]} />
      <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.55} />
    </mesh>
  );
}

/**
 * One material per block type. Tuned to keep instance-colour tint
 * working: low/no metalness on bright types, restrained emissive
 * (multiplied at night by a uniform that updates each frame).
 */
function makeMaterial(type: BlockType, nightFactor: number): THREE.Material {
  const def = BLOCK_BY_ID[type];
  const baseColor = new THREE.Color('#FFFFFF'); // tint via instanceColor multiplies this
  const emissive = new THREE.Color(def.color);

  // Per-category material params
  const cat = def.category;
  const isCrystal = cat === 'zk' || cat === 'oracle' || cat === 'token';
  const isMetal = cat === 'defi' || cat === 'security';
  const isMarble = cat === 'governance';
  const isWater = cat === 'water';
  const isLight = cat === 'light';
  const isFoliage = cat === 'foliage';

  const m = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive,
    emissiveIntensity: baseEmissiveFor(def, nightFactor, {
      isCrystal, isMetal, isMarble, isWater, isLight, isFoliage,
    }),
    metalness: isMetal ? 0.85 : isCrystal ? 0.1 : isMarble ? 0.05 : isWater ? 0.4 : 0.18,
    roughness: isMetal ? 0.3 : isMarble ? 0.55 : isCrystal ? 0.18 : isWater ? 0.15 : isFoliage ? 0.7 : 0.45,
    transparent: isWater,
    opacity: isWater ? 0.78 : 1,
  });
  // Allow per-instance .color attribute to multiply
  m.vertexColors = true;
  return m;
}

function baseEmissiveFor(
  def: { emitsAtNight?: boolean; color: string; category: string },
  nightFactor: number,
  flags: { isCrystal: boolean; isLight: boolean; isFoliage: boolean; isMarble: boolean; isMetal: boolean; isWater: boolean },
): number {
  const dayBase =
    flags.isCrystal ? 0.45 :
    flags.isLight ? 0.25 :
    flags.isMetal ? 0.06 :
    flags.isMarble ? 0.0 :
    flags.isFoliage ? 0.04 :
    flags.isWater ? 0.32 : // mid-bright so shimmer reads
    0.2;
  if (!def.emitsAtNight) return dayBase;
  // Night boost: emissive multiplied up to ~3x at full night
  return dayBase + nightFactor * 1.6;
}

function lighten(hex: string, amount: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return c;
}
