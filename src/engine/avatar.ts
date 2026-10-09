import Phaser from 'phaser';
import type { GameSpec } from '../types';

export const AVATAR_KEY = 'player-avatar';
export const RIVAL_KEY = 'rival-avatar';

export type PlayerSprite = Phaser.GameObjects.Text | Phaser.GameObjects.Image;

export function preloadAvatarImage(scene: Phaser.Scene, key: string, image?: string): void {
  if (!image) return;
  if (image.endsWith('.svg')) {
    scene.load.svg(key, image, { width: 160, height: 160 });
  } else {
    scene.load.image(key, image);
  }
}

export function createAvatarSprite(
  scene: Phaser.Scene,
  key: string,
  emoji: string,
  x: number,
  y: number,
  height = 56,
): PlayerSprite {
  if (scene.textures.exists(key)) {
    const sprite = scene.add.image(x, y, key);
    sprite.setScale(height / sprite.height);
    return sprite;
  }
  return scene.add.text(x, y, emoji, { fontSize: `${height + 4}px` }).setOrigin(0.5);
}

export function preloadPlayer(scene: Phaser.Scene, spec: GameSpec): void {
  preloadAvatarImage(scene, AVATAR_KEY, spec.player.image);
}

export function createPlayer(scene: Phaser.Scene, spec: GameSpec, x: number, y: number, height = 56): PlayerSprite {
  return createAvatarSprite(scene, AVATAR_KEY, spec.player.emoji, x, y, height);
}
