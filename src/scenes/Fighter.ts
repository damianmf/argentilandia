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
import { tribuna } from '../engine/tribuna';

const FONT = 'system-ui, -apple-system, sans-serif';
const FLOOR_Y = 470;
const PLAYER_SPEED = 420;
const PLAYER_COOLDOWN = 600;
const REACH = 95;
const LUNGE = 20;
const KNOCKBACK = 48;
const END_DELAY = 700;
const HIT_STOP = 75;
const PUNCH_WORDS = ['¡PUM!', '¡ZAS!', '¡TROMPA!', '¡BAM!'];

export class Fighter extends Phaser.Scene {
  private spec: GameSpecFighter;
  private params!: ReturnType<typeof fighterParams>;
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
  private hitStopUntil = 0;
  private koEnCurso = false;
  private crowd: Phaser.GameObjects.Text[] = [];
  private punchWords: string[] = PUNCH_WORDS;
  private rivalWords: string[] = PUNCH_WORDS;
  private difficulty = 0;
  private usedDifficulty = 5;
  private log: ('p' | 'r' | 'w')[] = [];

  init(data: { difficulty?: number }): void {
    this.difficulty = data?.difficulty ?? 0;
  }
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private playerBar!: Phaser.GameObjects.Rectangle;
  private rivalBar!: Phaser.GameObjects.Rectangle;

  constructor(spec: GameSpecFighter) {
    super('Fighter');
    this.spec = spec;
  }

  preload(): void {
    preloadPlayer(this, this.spec);
    preloadAvatarImage(this, RIVAL_KEY, this.spec.rival.image);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.usedDifficulty = this.difficulty > 0 ? this.difficulty : this.spec.difficulty;
    this.params = fighterParams(this.usedDifficulty);
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
    this.log = [];
    this.punchWords = this.spec.punchWords && this.spec.punchWords.length > 0 ? this.spec.punchWords : PUNCH_WORDS;
    this.rivalWords = this.spec.rivalWords && this.spec.rivalWords.length > 0 ? this.spec.rivalWords : PUNCH_WORDS;

    if (this.spec.crowd && this.spec.crowd.length > 0) {
      const width = this.scale.width;
      const step = width / this.spec.crowd.length;
      this.spec.crowd.forEach((emoji, i) => {
        const fan = this.add
          .text(step * i + step / 2, FLOOR_Y - 128 + (i % 2) * 26, emoji, { fontSize: '36px' })
          .setOrigin(0.5)
          .setAlpha(0.45);
        this.crowd.push(fan);
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

    sfx.bell();
    this.comicFx(this.scale.width / 2, 180, '¡DING DING!', '#ffffff', 40);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.targetX = pointer.x;
    });
    this.input.on('pointerdown', () => this.punch());
    this.input.keyboard!.on('keydown-SPACE', () => this.punch());

    void tribuna(this, { y: 60, fontSize: 14, color: '#b8bdd4', fondoAlpha: 0.4 });
  }

  update(_time: number, delta: number): void {
    if (this.finished || this.koEnCurso) return;
    if (this.time.now < this.hitStopUntil) return;
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
    if (this.finished || this.koEnCurso || this.playerCooldown > 0) return;
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
        this.log.push(points > 0 ? 'p' : 'r');
        if (points > 0) this.rivalHp -= 1;
        else this.playerHp -= 1;
        this.score += points;
        defender.x = Phaser.Math.Clamp(defender.x + dir * KNOCKBACK, 50, this.scale.width - 50);
        this.hitFx(defender, points);
        this.cameras.main.shake(110, 0.007);
        this.hitStopUntil = this.time.now + HIT_STOP;
        this.crowdBounce();
        if (points > 0) {
          sfx.punch();
          this.flashEdge(0xffffff, 0.12);
        } else {
          sfx.crash();
          this.flashEdge(0xff3b30, 0.22);
        }
        this.scoreText.setText(`Puntos: ${this.score}`);
        this.refreshBars();
        if (this.rivalHp <= 0) this.koCinematic(this.rival, true);
        else if (this.playerHp <= 0) this.koCinematic(this.player, false);
      } else {
        if (this.log.length < 40) this.log.push('w');
        sfx.catch();
        this.comicFx(attacker.x + dir * 64, FLOOR_Y - 130, '¡FIU!', '#b8bdd1', 24);
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
    const word = Phaser.Utils.Array.GetRandom(points > 0 ? this.punchWords : this.rivalWords);
    this.comicFx(x, y - 46, word, points > 0 ? '#ffd166' : '#ff6b6b', points > 0 ? 46 : 40);
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
    const label = points > 0 ? `+${points}` : `${points}`;
    this.floatFx(x, y + 22, label);
  }

  private comicFx(x: number, y: number, text: string, color: string, size: number): void {
    const comic = this.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        stroke: '#101018',
        strokeThickness: Math.max(4, Math.round(size / 7)),
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAngle(Phaser.Math.Between(-10, 10))
      .setScale(0.3);
    this.tweens.add({
      targets: comic,
      scale: 1,
      duration: 160,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: comic,
          y: comic.y - 26,
          alpha: 0,
          delay: 320,
          duration: 420,
          onComplete: () => comic.destroy(),
        });
      },
    });
  }

  private flashEdge(color: number, alpha: number): void {
    const flash = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, color)
      .setDepth(30)
      .setAlpha(alpha);
    this.tweens.add({ targets: flash, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
  }

  private crowdBounce(): void {
    for (const fan of this.crowd) {
      this.tweens.add({
        targets: fan,
        scaleY: fan.scaleY * 1.3,
        duration: 90,
        yoyo: true,
        ease: 'Quad.Out',
      });
    }
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

  // El momentazo grabable: congelón, caída en cámara lenta con zoom, cartelazo
  // de ¡K.O.! y lluvia de papelitos. Sirve cayendo el rival o cayendo el jugador.
  private koCinematic(loser: PlayerSprite, ganoElJugador: boolean): void {
    this.koEnCurso = true;
    const headline = ganoElJugador ? '¡TROMPADA FINAL!' : 'TE ROMPIERON LA CAMISETA';

    // Acto 1 — el golpe pesa el triple
    this.flashEdge(0xffffff, 0.5);
    this.cameras.main.shake(220, 0.012);
    this.hitStopUntil = this.time.now + 200;
    sfx.punch();

    this.time.delayedCall(200, () => {
      // Acto 2 — caída en cámara lenta, la cámara va a buscarlo
      sfx.crash();
      this.cameras.main.startFollow(loser, true, 0.08, 0.08);
      this.cameras.main.zoomTo(1.8, 420, 'Sine.InOut');
      const dir = Math.sign(loser.x - (ganoElJugador ? this.player.x : this.rival.x)) || 1;
      this.tweens.add({
        targets: loser,
        angle: dir * 95,
        y: FLOOR_Y - 26,
        duration: 850,
        ease: 'Quad.In',
        onComplete: () => {
          this.cameras.main.shake(90, 0.006);
          sfx.crash();
        },
      });
      this.lluviaPapelitos();

      // Acto 3 — cartelazo
      this.time.delayedCall(480, () => {
        const ko = this.add
          .text(loser.x, 140, '¡K.O.!', {
            fontFamily: FONT,
            fontSize: '120px',
            fontStyle: 'bold',
            color: '#ffd166',
            stroke: '#101018',
            strokeThickness: 16,
            padding: { x: 14, y: 6 },
          })
          .setOrigin(0.5)
          .setDepth(40)
          .setScale(3)
          .setAngle(-7);
        this.tweens.add({ targets: ko, scale: 1, duration: 300, ease: 'Back.Out' });
      });

      // Acto 4 — la cámara vuelve y sale el Outro con las stats
      this.time.delayedCall(1600, () => {
        this.cameras.main.stopFollow();
        this.cameras.main.zoomTo(1, 450, 'Sine.InOut');
        this.cameras.main.pan(this.scale.width / 2, this.scale.height / 2, 450, 'Sine.InOut');
      });
      this.time.delayedCall(2400, () => this.finish(headline));
    });
  }

  private lluviaPapelitos(): void {
    const colores = [0xffffff, 0x74c0fc, 0xff8787, 0xffd43b];
    for (let i = 0; i < 26; i++) {
      const papelito = this.add
        .rectangle(
          Phaser.Math.Between(0, this.scale.width),
          -20 - Phaser.Math.Between(0, 280),
          Phaser.Math.Between(7, 12),
          Phaser.Math.Between(10, 16),
          Phaser.Utils.Array.GetRandom(colores),
        )
        .setAngle(Phaser.Math.Between(0, 360))
        .setDepth(35);
      this.tweens.add({
        targets: papelito,
        y: this.scale.height + 30,
        angle: papelito.angle + Phaser.Math.Between(-260, 260),
        duration: Phaser.Math.Between(1800, 3000),
        delay: Phaser.Math.Between(0, 700),
      });
    }
    for (let i = 0; i < 8; i++) {
      const rollo = this.add
        .text(Phaser.Math.Between(40, this.scale.width - 40), -40 - Phaser.Math.Between(0, 300), '🧻', {
          fontSize: `${Phaser.Math.Between(24, 34)}px`,
        })
        .setOrigin(0.5)
        .setDepth(35);
      this.tweens.add({
        targets: rollo,
        y: this.scale.height + 40,
        x: rollo.x + Phaser.Math.Between(-40, 40),
        angle: Phaser.Math.Between(-320, 320),
        duration: Phaser.Math.Between(2000, 3200),
        delay: Phaser.Math.Between(0, 600),
      });
    }
  }

  private finish(headline: string): void {
    if (this.finished) return;
    this.finished = true;
    sfx.whistle();
    this.comicFx(this.scale.width / 2, 150, '🧑‍⚖️ ¡PIIIII!', '#ffffff', 58);
    const landed = this.log.filter((entry) => entry === 'p').length;
    const received = this.log.filter((entry) => entry === 'r').length;
    const strip = this.log
      .slice(0, 30)
      .map((entry) => (entry === 'p' ? '🟦' : entry === 'r' ? '🟥' : '⬜'))
      .join('');
    const verdicts =
      this.spec.verdicts && this.spec.verdicts.length === 4
        ? this.spec.verdicts
        : ['Novato del alambrado', 'Se hizo respetar', 'Dueño de la pelea', 'Leyenda del alambrado'];
    const tier = this.score < 0 ? 0 : this.score < 450 ? 1 : this.score < 900 ? 2 : 3;
    this.time.delayedCall(END_DELAY, () => {
      this.scene.start('Outro', {
        score: this.score,
        headline,
        stats: {
          landed,
          received,
          strip,
          verdict: verdicts[tier],
          difficulty: this.usedDifficulty,
        },
      });
    });
  }
}
