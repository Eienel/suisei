import mitt, { type Emitter } from 'mitt';
import type { BrickType } from './bricks/brickTypes';
import type { PlacedBrick } from '@/types';

/**
 * The single seam between React and Phaser.
 * - React → Phaser: SPAWN_BRICK, RESET_BOARD
 * - Phaser → React: BRICK_PLACED, BRICK_MOVED, BRICK_REMOVED
 */
export type GameEvents = {
  SPAWN_BRICK: { type: BrickType };
  RESET_BOARD: undefined;
  BRICK_PLACED: PlacedBrick;
  BRICK_MOVED: PlacedBrick;
  BRICK_REMOVED: { uid: string };
};

export const bus: Emitter<GameEvents> = mitt<GameEvents>();
