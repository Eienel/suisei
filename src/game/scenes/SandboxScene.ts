import Phaser from 'phaser';
import { Brick, BRICK_W, BRICK_H, GRID } from '@/game/bricks/Brick';
import { BRICK_BY_ID, type BrickType } from '@/game/bricks/brickTypes';
import { bus } from '@/game/events';

const ADJ_PAD = 6;
const LONG_PRESS_MS = 550;

export class SandboxScene extends Phaser.Scene {
  private gridGfx!: Phaser.GameObjects.Graphics;
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private pressTarget: Brick | null = null;
  private pressDidMove = false;

  constructor() {
    super('SandboxScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#FAF7F2');
    this.drawGrid();
    this.scale.on('resize', this.handleResize, this);

    this.spawnBrick('block');

    bus.on('SPAWN_BRICK', ({ type }) => this.spawnBrick(type));
    bus.on('RESET_BOARD', () => this.resetBoard());
    bus.on('SET_COSMETIC', ({ skin }) => this.applyCosmetic(skin));

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
      'dragstart',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (obj instanceof Brick) this.children.bringToTop(obj);
      }
    );

    this.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (!(obj instanceof Brick)) return;
        const { gridX, gridY } = obj.snapToGrid(obj.x, obj.y);

        if (this.collidesWithOther(obj)) {
          obj.flashInvalid();
          return;
        }

        obj.rememberAsValid(gridX, gridY);
        obj.flashValid();
        bus.emit('BRICK_MOVED', { uid: obj.uid, type: obj.def.id, gridX, gridY });

        const fused = this.findAdjacent(obj);
        if (fused.length > 0) {
          obj.sparkle();
          fused.forEach((n) => n.sparkle());
        }
      }
    );

    this.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
        const target = currentlyOver.find((o): o is Brick => o instanceof Brick);
        if (!target) return;
        if (pointer.rightButtonDown()) {
          this.removeBrick(target);
          return;
        }
        // Start long-press timer for touch removal.
        this.pressTarget = target;
        this.pressDidMove = false;
        this.pressTimer = setTimeout(() => {
          if (this.pressTarget && !this.pressDidMove) {
            this.removeBrick(this.pressTarget);
          }
          this.pressTimer = null;
          this.pressTarget = null;
        }, LONG_PRESS_MS);
      }
    );

    this.input.on('pointermove', () => {
      this.pressDidMove = true;
    });

    const cancelPress = () => {
      if (this.pressTimer) clearTimeout(this.pressTimer);
      this.pressTimer = null;
      this.pressTarget = null;
    };
    this.input.on('pointerup', cancelPress);
    this.input.on('pointerupoutside', cancelPress);
    this.input.on('gameout', cancelPress);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off('SPAWN_BRICK');
      bus.off('RESET_BOARD');
      bus.off('SET_COSMETIC');
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private applyCosmetic(skin: string | null) {
    this.allBricks().forEach((b) => b.applyCosmetic(skin));
  }

  private spawnBrick(type: BrickType) {
    const def = BRICK_BY_ID[type];
    if (!def || !def.enabled) return;
    const cam = this.cameras.main;
    const cx = Math.round(cam.width / 2 / GRID) * GRID;
    const cy = Math.round(cam.height / 2 / GRID) * GRID;

    // Find a non-colliding spawn slot near the center.
    const { x, y } = this.findFreeSlotNear(cx, cy);
    const uid = `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const brick = new Brick(this, x, y, def, uid);
    brick.rememberAsValid(x / GRID, y / GRID);
    bus.emit('BRICK_PLACED', { uid, type, gridX: x / GRID, gridY: y / GRID });
    return brick;
  }

  private removeBrick(brick: Brick) {
    bus.emit('BRICK_REMOVED', { uid: brick.uid });
    brick.destroy();
  }

  private resetBoard() {
    this.allBricks().forEach((b) => b.destroy());
  }

  private allBricks(): Brick[] {
    return this.children.list.filter((c): c is Brick => c instanceof Brick);
  }

  private rectFor(b: Brick): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(b.x - BRICK_W / 2, b.y - BRICK_H / 2, BRICK_W, BRICK_H);
  }

  private collidesWithOther(b: Brick): boolean {
    const me = this.rectFor(b);
    // Shrink by 1px so edge-touching neighbors are NOT collisions, only true overlap.
    me.x += 1;
    me.y += 1;
    me.width -= 2;
    me.height -= 2;
    return this.allBricks().some(
      (other) => other !== b && Phaser.Geom.Rectangle.Overlaps(me, this.rectFor(other))
    );
  }

  private findAdjacent(b: Brick): Brick[] {
    const me = this.rectFor(b);
    const expanded = new Phaser.Geom.Rectangle(
      me.x - ADJ_PAD,
      me.y - ADJ_PAD,
      me.width + ADJ_PAD * 2,
      me.height + ADJ_PAD * 2
    );
    return this.allBricks().filter(
      (other) => other !== b && Phaser.Geom.Rectangle.Overlaps(expanded, this.rectFor(other))
    );
  }

  private findFreeSlotNear(cx: number, cy: number): { x: number; y: number } {
    // Spiral outward from (cx, cy) on the snap grid until we find no collision.
    const offsets: Array<[number, number]> = [];
    const maxR = 12;
    for (let r = 0; r <= maxR; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) offsets.push([dx, dy]);
        }
      }
    }
    for (const [dx, dy] of offsets) {
      const x = cx + dx * BRICK_W;
      const y = cy + dy * BRICK_H;
      const probe = new Phaser.Geom.Rectangle(x - BRICK_W / 2 + 1, y - BRICK_H / 2 + 1, BRICK_W - 2, BRICK_H - 2);
      const hit = this.allBricks().some((o) => Phaser.Geom.Rectangle.Overlaps(probe, this.rectFor(o)));
      if (!hit) return { x, y };
    }
    return { x: cx, y: cy };
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
