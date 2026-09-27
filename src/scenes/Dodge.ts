import Phaser from 'phaser';
import type { CatchObject, GameSpecDodge } from '../types';
import { difficultyParams } from '../engine/difficulty';

const FONT = 'system-ui, -apple-system, sans-serif';
const PLAYER_SPEED = 560;
const DODGE_BONUS = 25;

export class Dodge extends Phaser.Scene {
  private spec: GameSpecDodge;
  private params: ReturnType<typeof difficultyParams>;
  private player!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private drops: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private targetX = 0;
  private score = 0;
  private elapsed = 0;

  constructor(spec: GameSpecDodge) {
    super('Dodge');
    this.spec = spec;
    this.params = difficultyParams(spec.difficulty);
  }

  create(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.targetX = this.scale.width / 2;
    this.score = 0;
    this.elapsed = 0;
    this.drops = [];

    this.player = this.add
      .text(this.scale.width / 2, this.scale.height - 46, this.spec.player.emoji, {
        fontSize: '52px',
      })
      .setOrigin(0.5);

    this.scoreText = this.add.text(24, 16, this.hudScore(), {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    });

    this.timeText = this.add
      .text(this.scale.width - 24, 16, '', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#cfcfe8',
      })
      .setOrigin(1, 0);

    this.time.addEvent({
      delay: this.params.spawnInterval,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x;
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const step = PLAYER_SPEED * dt;
    let moved = false;
    if (this.cursors.left.isDown) {
      this.player.x -= step;
      moved = true;
    }
    if (this.cursors.right.isDown) {
      this.player.x += step;
      moved = true;
    }
    if (moved) {
      this.targetX = this.player.x;
    } else {
      this.player.x += (this.targetX - this.player.x) * Math.min(1, dt * 18);
    }
    const half = this.player.displayWidth / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, half, this.scale.width - half);

    this.elapsed += delta;
    const remaining = Math.max(0, Math.ceil((this.spec.duration * 1000 - this.elapsed) / 1000));
    this.timeText.setText(`${remaining}s`);
    if (this.elapsed >= this.spec.duration * 1000) {
      this.scene.start('Outro', { score: this.score });
      return;
    }

    for (const drop of [...this.drops]) {
      drop.y += this.params.fallSpeed * dt;
      if (drop.y > this.scale.height + 40) {
        drop.destroy();
        this.drops = this.drops.filter((d) => d !== drop);
        this.score += DODGE_BONUS;
        this.scoreText.setText(this.hudScore());
        continue;
      }
      const dx = Math.abs(drop.x - this.player.x);
      const dy = Math.abs(drop.y - this.player.y);
      const reachX = ((drop.displayWidth + this.player.displayWidth) / 2) * 0.55;
      const reachY = ((drop.displayHeight + this.player.displayHeight) / 2) * 0.55;
      if (dy < reachY && dx < reachX) {
        this.crash(drop);
      }
    }
  }

  private spawnDrop(): void {
    const item = this.pick();
    const x = Phaser.Math.Between(40, this.scale.width - 40);
    const drop = this.add.text(x, -30, item.emoji, { fontSize: '40px' }).setOrigin(0.5);
    drop.setData('points', item.points);
    this.drops.push(drop);
  }

  private pick(): CatchObject {
    const pool = this.spec.obstacles;
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  private crash(drop: Phaser.GameObjects.Text): void {
    const points = drop.getData('points') as number;
    this.score += points;
    this.scoreText.setText(this.hudScore());
    this.drops = this.drops.filter((d) => d !== drop);
    this.tweens.add({
      targets: this.player,
      alpha: 0.2,
      yoyo: true,
      duration: 90,
    });
    this.tweens.add({
      targets: drop,
      scale: drop.scale * 1.6,
      alpha: 0,
      duration: 180,
      onComplete: () => drop.destroy(),
    });
  }

  private hudScore(): string {
    return `Puntos: ${this.score}`;
  }
}
