import Phaser from 'phaser';

const FONT = 'system-ui, -apple-system, sans-serif';

export class GameOver extends Phaser.Scene {
  private score = 0;

  constructor() {
    super('GameOver');
  }

  init(data: { score?: number }): void {
    this.score = data.score ?? 0;
  }

  create(): void {
    const cx = this.scale.width / 2;

    this.add
      .text(cx, 180, 'SE TERMINÓ EL TIEMPO', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const color = this.score < 0 ? '#ff6b6b' : '#7bed9f';
    this.add
      .text(cx, 280, `Puntaje final: ${this.score}`, {
        fontFamily: FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        color,
      })
      .setOrigin(0.5);

    const retry = this.add
      .text(cx, 420, 'REINTENTAR', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#2e86de',
        padding: { x: 40, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setBackgroundColor('#4a9bef'));
    retry.on('pointerout', () => retry.setBackgroundColor('#2e86de'));
    retry.on('pointerup', () => this.scene.start('Title'));
  }
}
