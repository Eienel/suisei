import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SandboxScene } from './scenes/SandboxScene';

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#FAF7F2',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    scene: [BootScene, SandboxScene],
    input: {
      activePointers: 3,
      mouse: {
        preventDefaultWheel: false,
        // Allow right-click to be captured by the scene without browser menu.
        // The Scene listens via input 'pointerdown' + rightButtonDown().
      },
    },
    disableContextMenu: true,
    render: {
      antialias: true,
      roundPixels: false,
    },
  });
}
