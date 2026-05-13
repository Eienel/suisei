import * as THREE from 'three';
import { useMemo } from 'react';
import type { BlockType } from '@/types';

/**
 * One material expression per block category. Designed so each block
 * reads at-a-glance even at small zoom levels: crystal (translucent +
 * emissive), marble (clean matte), metal (high specular), neural
 * (pink emissive), bunker (dark roughness), etc.
 *
 * Returns a <material> element that goes inside a <mesh>.
 */
export function BlockMaterial({ type, selected }: { type: BlockType; selected: boolean }) {
  const props = useMemo(() => materialFor(type), [type]);
  const emissiveBoost = selected ? 1.5 : 1;
  return (
    <meshPhysicalMaterial
      {...props}
      emissiveIntensity={(props.emissiveIntensity ?? 0) * emissiveBoost}
    />
  );
}

interface MatProps {
  color: THREE.ColorRepresentation;
  emissive: THREE.ColorRepresentation;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  transmission?: number;
  thickness?: number;
  ior?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  attenuationColor?: THREE.ColorRepresentation;
  attenuationDistance?: number;
  envMapIntensity?: number;
}

function materialFor(type: BlockType): MatProps {
  switch (type) {
    case 'zk_crystal':
      // Translucent glowing crystal
      return {
        color: '#00E5FF',
        emissive: '#00E5FF',
        emissiveIntensity: 0.55,
        metalness: 0.05,
        roughness: 0.1,
        transmission: 0.6,
        thickness: 0.8,
        ior: 1.6,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        attenuationColor: '#00E5FF',
        attenuationDistance: 1.2,
        envMapIntensity: 1.2,
      };
    case 'data_core':
      // Pulsing neon cube, semi-emissive plastic
      return {
        color: '#1B1340',
        emissive: '#8B5CF6',
        emissiveIntensity: 0.7,
        metalness: 0.1,
        roughness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      };
    case 'defi_vault':
      // Brushed amber-gold metal
      return {
        color: '#FFB020',
        emissive: '#FF6A00',
        emissiveIntensity: 0.08,
        metalness: 0.95,
        roughness: 0.28,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25,
        envMapIntensity: 1.5,
      };
    case 'governance_marble':
      // Clean white marble, soft sheen
      return {
        color: '#F1EEE6',
        emissive: '#000000',
        emissiveIntensity: 0,
        metalness: 0.0,
        roughness: 0.55,
        clearcoat: 0.6,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.6,
      };
    case 'ai_neural':
      // Hot pink emissive neural node
      return {
        color: '#330922',
        emissive: '#FF2D92',
        emissiveIntensity: 0.85,
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      };
    case 'security_bunker':
      // Reinforced dark industrial metal
      return {
        color: '#2A3A56',
        emissive: '#3B82F6',
        emissiveIntensity: 0.08,
        metalness: 0.8,
        roughness: 0.55,
        clearcoat: 0.2,
        clearcoatRoughness: 0.6,
      };
    case 'wallet_keystone':
      // Warm engraved gold-stone
      return {
        color: '#E8B23A',
        emissive: '#FACC15',
        emissiveIntensity: 0.18,
        metalness: 0.6,
        roughness: 0.45,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
      };
    case 'oracle_lens':
      // Glassy cyan lens
      return {
        color: '#22D3EE',
        emissive: '#22D3EE',
        emissiveIntensity: 0.35,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.7,
        thickness: 0.6,
        ior: 1.55,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        attenuationColor: '#22D3EE',
        attenuationDistance: 1.5,
      };
    case 'token_prism':
      // Faceted pink prism — high specular, slight transmission
      return {
        color: '#F472B6',
        emissive: '#F472B6',
        emissiveIntensity: 0.25,
        metalness: 0.3,
        roughness: 0.15,
        transmission: 0.35,
        thickness: 0.5,
        ior: 1.7,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      };
    case 'contract_obelisk':
      // Dark cyan-edged code monolith
      return {
        color: '#0E1A2A',
        emissive: '#06B6D4',
        emissiveIntensity: 0.4,
        metalness: 0.4,
        roughness: 0.4,
        clearcoat: 0.7,
        clearcoatRoughness: 0.2,
      };
  }
}

/** True if this type should pulse/breathe gently on idle. */
export function isAnimatedIdle(type: BlockType): boolean {
  return (
    type === 'zk_crystal' ||
    type === 'data_core' ||
    type === 'ai_neural' ||
    type === 'oracle_lens' ||
    type === 'contract_obelisk'
  );
}

/** True if this type wants a small accent geometry on top. */
export function hasAccent(type: BlockType): boolean {
  return (
    type === 'wallet_keystone' ||
    type === 'governance_marble' ||
    type === 'security_bunker' ||
    type === 'defi_vault' ||
    type === 'token_prism' ||
    type === 'contract_obelisk' ||
    type === 'oracle_lens' ||
    type === 'ai_neural'
  );
}
