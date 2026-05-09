import Phaser from 'phaser';
import type { BrickDef } from './brickTypes';

export const BRICK_W = 96;
export const BRICK_H = 64;
export const STUD_R = 12;
export const GRID = 32;

/**
 * A single draggable brick rendered as a rounded body + two studs + label.
 * - dragstart: remember snap-back position
 * - dragend: scene decides valid/invalid; calls onValidPlacement or onInvalidPlacement
 */
export class Brick extends Phaser.GameObjects.Container {
  uid: string;
  def: BrickDef;
  gfx: Phaser.GameObjects.Graphics;
  outline: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;

  /** Last known valid grid position (for snap-back on invalid drop). */
  lastValidGridX = 0;
  lastValidGridY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: BrickDef, uid: string) {
    super(scene, x, y);
    this.uid = uid;
    this.def = def;

    this.outline = scene.add.graphics();
    this.add(this.outline);

    this.gfx = scene.add.graphics();
    this.drawBody();
    this.add(this.gfx);

    this.label = scene.add
      .text(0, 4, def.label.toUpperCase(), {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.setSize(BRICK_W, BRICK_H);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-BRICK_W / 2, -BRICK_H / 2, BRICK_W, BRICK_H),
      Phaser.Geom.Rectangle.Contains
    );
    scene.input.setDraggable(this);

    scene.add.existing(this);
  }

  private drawBody() {
    const g = this.gfx;
    g.clear();

    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(-BRICK_W / 2 + 2, -BRICK_H / 2 + 6, BRICK_W, BRICK_H, 12);

    const color = Phaser.Display.Color.HexStringToColor(this.def.color).color;
    g.fillStyle(color, 1);
    g.fillRoundedRect(-BRICK_W / 2, -BRICK_H / 2, BRICK_W, BRICK_H, 12);

    const stud = Phaser.Display.Color.HexStringToColor(this.def.studColor).color;
    g.fillStyle(stud, 1);
    g.fillRoundedRect(-BRICK_W / 2, -BRICK_H / 2, BRICK_W, 10, { tl: 12, tr: 12, bl: 0, br: 0 });

    g.fillStyle(stud, 1);
    g.fillCircle(-BRICK_W / 4, -BRICK_H / 2 - STUD_R + 4, STUD_R);
    g.fillCircle(BRICK_W / 4, -BRICK_H / 2 - STUD_R + 4, STUD_R);
    g.lineStyle(2, 0x000000, 0.15);
    g.strokeCircle(-BRICK_W / 4, -BRICK_H / 2 - STUD_R + 4, STUD_R);
    g.strokeCircle(BRICK_W / 4, -BRICK_H / 2 - STUD_R + 4, STUD_R);
  }

  snapToGrid(rawX: number, rawY: number) {
    const gx = Math.round(rawX / GRID);
    const gy = Math.round(rawY / GRID);
    this.setPosition(gx * GRID, gy * GRID);
    return { gridX: gx, gridY: gy };
  }

  rememberAsValid(gridX: number, gridY: number) {
    this.lastValidGridX = gridX;
    this.lastValidGridY = gridY;
  }

  revertToLastValid() {
    this.setPosition(this.lastValidGridX * GRID, this.lastValidGridY * GRID);
  }

  /** Brief red outline + side-to-side shake on invalid placement. */
  flashInvalid() {
    this.drawOutline(0xef4444, 1);
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 4, to: this.x + 4 },
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.outline.clear();
        this.revertToLastValid();
      },
    });
  }

  /** Brief green outline + soft pulse on valid placement. */
  flashValid() {
    this.drawOutline(0x22c55e, 1);
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.06 },
      duration: 100,
      yoyo: true,
      onComplete: () => this.outline.clear(),
    });
  }

  /** Stud-sparkle pulse, used when a brick fuses with neighbors. */
  sparkle() {
    const studs = [
      { x: -BRICK_W / 4, y: -BRICK_H / 2 - STUD_R + 4 },
      { x: BRICK_W / 4, y: -BRICK_H / 2 - STUD_R + 4 },
    ];
    studs.forEach((p) => {
      const ring = this.scene.add.graphics({ x: this.x + p.x, y: this.y + p.y });
      ring.lineStyle(3, 0xffffff, 1);
      ring.strokeCircle(0, 0, STUD_R);
      this.scene.tweens.add({
        targets: ring,
        scale: { from: 1, to: 2.2 },
        alpha: { from: 1, to: 0 },
        duration: 360,
        onComplete: () => ring.destroy(),
      });
    });
  }

  private drawOutline(color: number, alpha: number) {
    const o = this.outline;
    o.clear();
    o.lineStyle(3, color, alpha);
    o.strokeRoundedRect(-BRICK_W / 2 - 2, -BRICK_H / 2 - 2, BRICK_W + 4, BRICK_H + 4, 14);
  }

  override destroy(fromScene?: boolean) {
    this.outline.destroy();
    this.gfx.destroy();
    this.label.destroy();
    super.destroy(fromScene);
  }
}
