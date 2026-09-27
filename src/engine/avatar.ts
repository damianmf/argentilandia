import Phaser from 'phaser';
import type { GameSpec } from '../types';

const AVATAR_KEY = 'player-avatar';

export type PlayerSprite = Phaser.GameObjects.Text | Phaser.GameObjects.Image;

export function preloadPlayer(scene: Phaser.Scene, spec: GameSpec): void {
  const image = spec.player.image;
  if (!image) return;
  if (image.endsWith('.svg')) {
    scene.load.svg(AVATAR_KEY, image, { width: 160, height: 160 });
  } else {
    scene.load.image(AVATAR_KEY, image);
  }
}

export function createPlayer(scene: Phaser.Scene, spec: GameSpec, x: number, y: number, height = 56): PlayerSprite {
  if (spec.player.image) {
    const sprite = scene.add.image(x, y, AVATAR_KEY);
    sprite.setScale(height / sprite.height);
    return sprite;
  }
  return scene.add.text(x, y, spec.player.emoji, { fontSize: `${height + 4}px` }).setOrigin(0.5);
}
