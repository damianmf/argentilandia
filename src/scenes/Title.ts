import Phaser from 'phaser';
import type { GameSpec } from '../types';
import { applyTheme } from '../engine/theme';
import { createPlayer, preloadPlayer } from '../engine/avatar';
import { initAudio } from '../engine/audio';

const FONT = 'system-ui, -apple-system, sans-serif';

export class Title extends Phaser.Scene {
  private spec: GameSpec;

  constructor(spec: GameSpec) {
    super('Title');
    this.spec = spec;
  }

  preload(): void {
    preloadPlayer(this, this.spec);
  }

  create(): void {
    const cx = this.scale.width / 2;

    applyTheme(this, this.spec);

    const title = this.add
      .text(cx, 90, this.spec.title, {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 880 },
      })
      .setOrigin(0.5);
    title.setScale(2.6);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => this.cameras.main.shake(140, 0.008),
    });

    const avatar = createPlayer(this, this.spec, cx, 225, this.spec.player.image ? 130 : 96);
    avatar.setScale(avatar.scaleY * 0.4);
    this.tweens.add({
      targets: avatar,
      scaleY: avatar.scaleY * (1 / 0.4),
      scaleX: avatar.scaleX * (1 / 0.4),
      duration: 420,
      delay: 180,
      ease: 'Back.Out',
    });

    this.add
      .text(cx, 350, this.spec.intro, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#cfcfe8',
        align: 'center',
        wordWrap: { width: 760 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 450, `Duración: ${this.spec.duration} segundos`, {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#8f8fb0',
      })
      .setOrigin(0.5);

    const play = this.add
      .text(cx, 530, 'JUGAR', {
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
    play.on('pointerup', () => {
      initAudio(this.spec.sound === true);
      this.scene.start(this.spec.game === 'dodge' ? 'Dodge' : 'Catcher');
    });
  }
}
