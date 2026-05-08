import Phaser from 'phaser';
import { Brick, GRID } from '@/game/bricks/Brick';
import { BRICK_BY_ID, type BrickType } from '@/game/bricks/brickTypes';
import { bus } from '@/game/events';

export class SandboxScene extends Phaser.Scene {
  private gridGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('SandboxScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#FAF7F2');
    this.drawGrid();
    this.scale.on('resize', this.handleResize, this);

    // Spawn one Block brick centered to start.
    this.spawnBrick('block');

    bus.on('SPAWN_BRICK', ({ type }) => this.spawnBrick(type));
    bus.on('RESET_BOARD', () => this.resetBoard());

    this.input.on(
      'drag',
      (
        _pointer: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number
      ) => {
        if (obj instanceof Brick) {
          obj.x = dragX;
          obj.y = dragY;
        }
      }
    );

    this.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (obj instanceof Brick) {
          const { gridX, gridY } = obj.snapToGrid(obj.x, obj.y);
          bus.emit('BRICK_MOVED', { uid: obj.uid, type: obj.def.id, gridX, gridY });
        }
      }
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off('SPAWN_BRICK');
      bus.off('RESET_BOARD');
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private spawnBrick(type: BrickType) {
    const def = BRICK_BY_ID[type];
    if (!def || !def.enabled) return;
    const cam = this.cameras.main;
    const startX = Math.round(cam.width / 2 / GRID) * GRID;
    const startY = Math.round(cam.height / 2 / GRID) * GRID;
    const uid = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const brick = new Brick(this, startX, startY, def, uid);
    bus.emit('BRICK_PLACED', { uid, type, gridX: startX / GRID, gridY: startY / GRID });
    return brick;
  }

  private resetBoard() {
    this.children.list
      .filter((c): c is Brick => c instanceof Brick)
      .forEach((b) => b.destroy());
  }

  private drawGrid() {
    if (this.gridGfx) this.gridGfx.destroy();
    this.gridGfx = this.add.graphics();
    this.gridGfx.lineStyle(1, 0x1a1f2e, 0.06);
    const w = this.scale.width;
    const h = this.scale.height;
    for (let x = 0; x <= w; x += GRID) {
      this.gridGfx.moveTo(x, 0);
      this.gridGfx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += GRID) {
      this.gridGfx.moveTo(0, y);
      this.gridGfx.lineTo(w, y);
    }
    this.gridGfx.strokePath();
    this.gridGfx.setDepth(-10);
  }

  private handleResize = () => {
    this.drawGrid();
  };
}
