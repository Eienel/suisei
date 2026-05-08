import type { BrickType } from '@/game/bricks/brickTypes';

export interface PlacedBrick {
  uid: string;
  type: BrickType;
  gridX: number;
  gridY: number;
}

export type Screen = 'landing' | 'sandbox';
