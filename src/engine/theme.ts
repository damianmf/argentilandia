import Phaser from 'phaser';
import type { GameSpec } from '../types';

export interface HudColors {
  score: string;
  time: string;
}

const DEFAULT_HUD: HudColors = { score: '#ffffff', time: '#cfcfe8' };

export function applyTheme(scene: Phaser.Scene, spec: GameSpec): void {
  if (!spec.theme) return;
  scene.cameras.main.setBackgroundColor(spec.theme.background);
  for (const item of spec.theme.decor ?? []) {
    const text = scene.add
      .text((item.x / 100) * scene.scale.width, (item.y / 100) * scene.scale.height, item.emoji, {
        fontSize: `${item.size ?? 48}px`,
      })
      .setOrigin(0.5)
      .setDepth(-1);
    if (item.alpha !== undefined) text.setAlpha(item.alpha);
  }
}

export function hudColors(spec: GameSpec): HudColors {
  return {
    score: spec.theme?.hud?.score ?? DEFAULT_HUD.score,
    time: spec.theme?.hud?.time ?? DEFAULT_HUD.time,
  };
}
