import Phaser from 'phaser';
import type { GameSpec } from '../types';

const FONT = 'system-ui, -apple-system, sans-serif';

export class Title extends Phaser.Scene {
  private spec: GameSpec;

  constructor(spec: GameSpec) {
    super('Title');
    this.spec = spec;
  }

  create(): void {
    const cx = this.scale.width / 2;

    this.add
      .text(cx, 90, this.spec.title, {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 880 },
      })
      .setOrigin(0.5);

    this.add.text(cx, 195, this.spec.emoji, { fontSize: '72px' }).setOrigin(0.5);

    this.add
      .text(cx, 320, this.spec.intro, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#cfcfe8',
        align: 'center',
        wordWrap: { width: 760 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 440, `Duración: ${this.spec.duration} segundos`, {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#8f8fb0',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(cx, 575, 'La mecánica se juega en la Fase 1', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setVisible(false);

    const play = this.add
      .text(cx, 515, 'JUGAR', {
        fontFamily: FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#2e86de',
        padding: { x: 40, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    play.on('pointerover', () => play.setBackgroundColor('#4a9bef'));
    play.on('pointerout', () => play.setBackgroundColor('#2e86de'));
    play.on('pointerup', () => hint.setVisible(true));
  }
}
