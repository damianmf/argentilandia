import Phaser from 'phaser';
import type { CatchObject, GameSpecDodge } from '../types';
import { difficultyParams } from '../engine/difficulty';
import { applyTheme, hudColors } from '../engine/theme';
import { createPlayer, preloadPlayer, type PlayerSprite } from '../engine/avatar';
import { sfx } from '../engine/audio';
import { HitStop, popPoints, popText, tickTime } from '../engine/juice';
import { tribuna } from '../engine/tribuna';

const FONT = 'system-ui, -apple-system, sans-serif';
const PLAYER_SPEED = 560;
const DODGE_BONUS = 25;

export class Dodge extends Phaser.Scene {
  private spec: GameSpecDodge;
  private params: ReturnType<typeof difficultyParams>;
  private player!: PlayerSprite;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private drops: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private targetX = 0;
  private score = 0;
  private elapsed = 0;
  private hitStop = new HitStop();
  private lastSecond = -1;
  private timeColor = '';

  constructor(spec: GameSpecDodge) {
    super('Dodge');
    this.spec = spec;
    this.params = difficultyParams(spec.difficulty);
  }

  preload(): void {
    preloadPlayer(this, this.spec);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.timeColor = colors.time;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.targetX = this.scale.width / 2;
    this.score = 0;
    this.elapsed = 0;
    this.drops = [];

    this.player = createPlayer(this, this.spec, this.scale.width / 2, this.scale.height - 46);

    this.scoreText = this.add.text(24, 16, this.hudScore(), {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors.score,
    });

    this.timeText = this.add
      .text(this.scale.width - 24, 16, '', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: colors.time,
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

    void tribuna(this, { y: 60, fontSize: 14, color: '#b8bdd4', fondoAlpha: 0.4 });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (this.hitStop.drain(delta)) return;
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
    if (remaining !== this.lastSecond) {
      this.lastSecond = remaining;
      tickTime(this, this.timeText, remaining, this.timeColor);
    }
    if (this.elapsed >= this.spec.duration * 1000) {
      sfx.end();
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
        sfx.dodge();
        popPoints(this, drop.x, this.scale.height - 70, DODGE_BONUS);
        popText(this, this.scoreText);
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
    sfx.crash();
    this.cameras.main.shake(140, 0.011);
    this.hitStop.stop(85);
    popPoints(this, drop.x, drop.y, points);
    popText(this, this.scoreText);
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
