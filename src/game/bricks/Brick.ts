import Phaser from 'phaser';
import type { BrickDef } from './brickTypes';

export const BRICK_W = 96;
export const BRICK_H = 64;
export const STUD_R = 12;
export const GRID = 32;

/**
 * A single draggable brick rendered as a rounded body + two studs + label.
 * Sprint 0: bare drag-and-snap. Sprint 1 layers on validity feedback.
 */
export class Brick extends Phaser.GameObjects.Container {
  uid: string;
  def: BrickDef;
  gfx: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, def: BrickDef, uid: string) {
    super(scene, x, y);
    this.uid = uid;
    this.def = def;

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

    // shadow
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(-BRICK_W / 2 + 2, -BRICK_H / 2 + 6, BRICK_W, BRICK_H, 12);

    // main body
    const color = Phaser.Display.Color.HexStringToColor(this.def.color).color;
    g.fillStyle(color, 1);
    g.fillRoundedRect(-BRICK_W / 2, -BRICK_H / 2, BRICK_W, BRICK_H, 12);

    // top highlight stripe
    const stud = Phaser.Display.Color.HexStringToColor(this.def.studColor).color;
    g.fillStyle(stud, 1);
    g.fillRoundedRect(-BRICK_W / 2, -BRICK_H / 2, BRICK_W, 10, { tl: 12, tr: 12, bl: 0, br: 0 });

    // studs
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
}
