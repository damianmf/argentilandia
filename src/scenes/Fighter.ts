import Phaser from 'phaser';
import type { GameSpecFighter } from '../types';
import { fighterParams } from '../engine/difficulty';
import { applyTheme, hudColors } from '../engine/theme';
import {
  createAvatarSprite,
  createPlayer,
  preloadAvatarImage,
  preloadPlayer,
  RIVAL_KEY,
  type PlayerSprite,
} from '../engine/avatar';
import { sfx } from '../engine/audio';

const FONT = 'system-ui, -apple-system, sans-serif';
const FLOOR_Y = 470;
const PLAYER_SPEED = 420;
const PLAYER_COOLDOWN = 600;
const REACH = 95;
const LUNGE = 20;
const KNOCKBACK = 48;
const END_DELAY = 700;

export class Fighter extends Phaser.Scene {
  private spec: GameSpecFighter;
  private params: ReturnType<typeof fighterParams>;
  private player!: PlayerSprite;
  private rival!: PlayerSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private targetX = 0;
  private score = 0;
  private elapsed = 0;
  private finished = false;
  private playerHp = 0;
  private rivalHp = 0;
  private playerCooldown = 0;
  private rivalCooldown = 0;
  private rivalOffset = 75;
  private rivalRetarget = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private playerBar!: Phaser.GameObjects.Rectangle;
  private rivalBar!: Phaser.GameObjects.Rectangle;

  constructor(spec: GameSpecFighter) {
    super('Fighter');
    this.spec = spec;
    this.params = fighterParams(spec.difficulty);
  }

  preload(): void {
    preloadPlayer(this, this.spec);
    preloadAvatarImage(this, RIVAL_KEY, this.spec.rival.image);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.targetX = this.scale.width * 0.32;
    this.score = 0;
    this.elapsed = 0;
    this.finished = false;
    this.playerHp = this.spec.koHits;
    this.rivalHp = this.spec.koHits;
    this.playerCooldown = 0;
    this.rivalCooldown = 0;
    this.rivalRetarget = 0;

    if (this.spec.crowd && this.spec.crowd.length > 0) {
      const width = this.scale.width;
      const step = width / this.spec.crowd.length;
      this.spec.crowd.forEach((emoji, i) => {
        this.add
          .text(step * i + step / 2, FLOOR_Y - 128 + (i % 2) * 26, emoji, { fontSize: '36px' })
          .setOrigin(0.5)
          .setAlpha(0.45);
      });
    }

    this.player = createPlayer(this, this.spec, this.scale.width * 0.32, FLOOR_Y - 46, 92);
    this.rival = createAvatarSprite(this, RIVAL_KEY, this.spec.rival.emoji, this.scale.width * 0.68, FLOOR_Y - 46, 92);
    if ('setFlipX' in this.rival) this.rival.setFlipX(true);

    this.scoreText = this.add.text(24, 16, 'Puntos: 0', {
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

    const barWidth = this.scale.width / 2 - 120;
    this.playerBar = this.add.rectangle(24, 56, barWidth, 12, 0x2ed573).setOrigin(0, 0.5);
    this.rivalBar = this.add.rectangle(this.scale.width - 24, 56, barWidth, 12, 0xff6b6b).setOrigin(1, 0.5);
    this.add.text(24, 70, this.spec.player.label, { fontFamily: FONT, fontSize: '13px', color: '#8f8fb0' });
    this.add
      .text(this.scale.width - 24, 70, this.spec.rival.label, { fontFamily: FONT, fontSize: '13px', color: '#8f8fb0' })
      .setOrigin(1, 0);

    this.refreshBars();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x;
    });
    this.input.on('pointerdown', () => this.punch());
    this.input.keyboard!.on('keydown-SPACE', () => this.punch());
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;
    const dt = delta / 1000;
    this.elapsed += delta;
    this.playerCooldown = Math.max(0, this.playerCooldown - delta);
    this.rivalCooldown = Math.max(0, this.rivalCooldown - delta);
    const remaining = Math.max(0, Math.ceil((this.spec.duration * 1000 - this.elapsed) / 1000));
    this.timeText.setText(`${remaining}s`);
    if (this.elapsed >= this.spec.duration * 1000) {
      this.finish('SE TERMINÓ EL TIEMPO');
      return;
    }

    const step = PLAYER_SPEED * dt;
    if (this.cursors.left.isDown) {
      this.player.x -= step;
      this.targetX = this.player.x;
    } else if (this.cursors.right.isDown) {
      this.player.x += step;
      this.targetX = this.player.x;
    } else {
      this.player.x += (this.targetX - this.player.x) * Math.min(1, dt * 14);
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 50, this.scale.width - 50);

    this.rivalRetarget -= delta;
    if (this.rivalRetarget <= 0) {
      this.rivalRetarget = Phaser.Math.Between(900, 1900);
      this.rivalOffset = Phaser.Math.Between(65, 130);
    }
    const desired = Phaser.Math.Clamp(this.player.x + this.rivalOffset, 60, this.scale.width - 60);
    this.rival.x += Phaser.Math.Clamp(desired - this.rival.x, -this.params.rivalSpeed * dt, this.params.rivalSpeed * dt);

    if (Math.abs(this.rival.x - this.player.x) < REACH && this.rivalCooldown <= 0) {
      if (Math.random() < this.params.aggression * dt) {
        this.rivalCooldown = this.params.rivalCooldown;
        this.strike(this.rival, this.player, this.spec.hitPenalty);
      }
    }
  }

  private punch(): void {
    if (this.finished || this.playerCooldown > 0) return;
    this.playerCooldown = PLAYER_COOLDOWN;
    this.strike(this.player, this.rival, this.spec.punchPoints);
  }

  private strike(attacker: PlayerSprite, defender: PlayerSprite, points: number): void {
    const dir = Math.sign(defender.x - attacker.x) || 1;
    const startX = attacker.x;
    this.tweens.add({ targets: attacker, x: startX + dir * LUNGE, duration: 90, yoyo: true });
    this.time.delayedCall(90, () => {
      if (this.finished) return;
      if (Math.abs(defender.x - attacker.x) < REACH + LUNGE) {
        if (points > 0) this.rivalHp -= 1;
        else this.playerHp -= 1;
        this.score += points;
        defender.x = Phaser.Math.Clamp(defender.x + dir * KNOCKBACK, 50, this.scale.width - 50);
        this.hitFx(defender, points);
        this.cameras.main.shake(110, 0.007);
        if (points > 0) sfx.catch();
        else sfx.crash();
        this.scoreText.setText(`Puntos: ${this.score}`);
        this.refreshBars();
        if (this.rivalHp <= 0) this.finish('¡TROMPADA FINAL!');
        else if (this.playerHp <= 0) this.finish('TE ROMPIERON LA CAMISETA');
      } else {
        this.floatFx(attacker.x + dir * 62, FLOOR_Y - 120, '💨');
      }
    });
  }

  private hitFx(target: PlayerSprite, points: number): void {
    const x = target.x;
    const y = (target.y as number) - 30;
    if ('setTint' in target) target.setTint(0xff8888);
    this.time.delayedCall(150, () => {
      if ('clearTint' in target) target.clearTint();
    });
    for (let i = 0; i < 3; i++) {
      const star = this.add
        .text(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-14, 8), i === 0 ? '💥' : '⭐', {
          fontSize: `${Phaser.Math.Between(20, 30)}px`,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: star,
        x: star.x + Phaser.Math.Between(-46, 46),
        y: star.y - Phaser.Math.Between(20, 55),
        alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        duration: 550,
        onComplete: () => star.destroy(),
      });
    }
    const label = points > 0 ? `+${points} ¡piña!` : `${points} ¡piña recibida!`;
    this.floatFx(x, y - 64, label);
  }

  private floatFx(x: number, y: number, text: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#101018e6',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => label.destroy(),
    });
  }

  private refreshBars(): void {
    const barWidth = this.scale.width / 2 - 120;
    this.playerBar.width = barWidth * Math.max(0, this.playerHp / this.spec.koHits);
    this.rivalBar.width = barWidth * Math.max(0, this.rivalHp / this.spec.koHits);
  }

  private finish(headline: string): void {
    if (this.finished) return;
    this.finished = true;
    sfx.end();
    this.time.delayedCall(END_DELAY, () => {
      this.scene.start('Outro', { score: this.score, headline });
    });
  }
}
