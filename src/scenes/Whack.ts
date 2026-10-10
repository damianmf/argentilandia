import Phaser from 'phaser';
import type { GameSpecWhack, SearchItem } from '../types';
import { whackParams } from '../engine/difficulty';
import { applyTheme, hudColors } from '../engine/theme';
import { createPlayer, preloadPlayer, type PlayerSprite } from '../engine/avatar';
import { sfx } from '../engine/audio';

const FONT = 'system-ui, -apple-system, sans-serif';
const AREA_TOP = 84;
const RISE = 34;
const NO_TOUCH_CHANCE = 0.16;
const END_DELAY = 700;
const DEFAULT_WORDS = ['¡VENDIDO!', '¡REMATADO!', '¡ADJUDICADO!'];

interface Pop {
  hole: number;
  item: SearchItem;
  noTouch: boolean;
  objects: Phaser.GameObjects.GameObject[];
  hit: boolean;
}

export class Whack extends Phaser.Scene {
  private spec: GameSpecWhack;
  private params: ReturnType<typeof whackParams>;
  private holes: { x: number; y: number }[] = [];
  private pops: Map<number, Pop> = new Map();
  private gavel?: PlayerSprite;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private score = 0;
  private elapsed = 0;
  private finished = false;
  private spawnAccum = 0;
  private hitCount = 0;
  private foulCount = 0;
  private log: ('h' | 'f')[] = [];

  constructor(spec: GameSpecWhack) {
    super('Whack');
    this.spec = spec;
    this.params = whackParams(spec.difficulty);
  }

  preload(): void {
    preloadPlayer(this, this.spec);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.score = 0;
    this.elapsed = 0;
    this.finished = false;
    this.spawnAccum = 0;
    this.hitCount = 0;
    this.foulCount = 0;
    this.log = [];
    this.pops.clear();

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

    this.buildHoles();

    this.gavel = createPlayer(this, this.spec, this.scale.width / 2, this.scale.height / 2, 58);
    this.gavel.setDepth(20);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gavel) this.gavel.setPosition(pointer.x, pointer.y);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gavel) {
        this.tweens.add({ targets: this.gavel, angle: -26, duration: 70, yoyo: true });
      }
      this.whackAt(pointer);
    });
  }

  private buildHoles(): void {
    const cols = this.spec.grid.width;
    const rows = this.spec.grid.height;
    const areaWidth = this.scale.width - 80;
    const areaHeight = this.scale.height - AREA_TOP - 60;
    const cellW = areaWidth / cols;
    const cellH = areaHeight / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 40 + cellW * col + cellW / 2;
        const y = AREA_TOP + 30 + cellH * row + cellH / 2;
        const rim = this.add.ellipse(x, y, 104, 30, 0x14100a);
        this.add.ellipse(x, y, 84, 20, 0x0a0805);
        rim.setStrokeStyle(3, 0x6e5a33);
        this.holes.push({ x, y });
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;
    this.elapsed += delta;
    const remaining = Math.max(0, Math.ceil((this.spec.duration * 1000 - this.elapsed) / 1000));
    this.timeText.setText(`${remaining}s`);
    if (this.elapsed >= this.spec.duration * 1000) {
      this.finish();
      return;
    }
    this.spawnAccum += delta;
    while (this.spawnAccum >= this.params.spawnInterval) {
      this.spawnAccum -= this.params.spawnInterval;
      this.spawn();
    }
  }

  private spawn(): void {
    const free: number[] = [];
    for (let i = 0; i < this.holes.length; i++) {
      if (!this.pops.has(i)) free.push(i);
    }
    if (free.length === 0) return;
    const hole = Phaser.Utils.Array.GetRandom(free);
    const noTouchPool = this.spec.noTouch ?? [];
    const noTouch = noTouchPool.length > 0 && Math.random() < NO_TOUCH_CHANCE;
    const item = noTouch
      ? Phaser.Utils.Array.GetRandom(noTouchPool)
      : Phaser.Utils.Array.GetRandom(this.spec.targets);
    const { x, y } = this.holes[hole];
    const emoji = this.add
      .text(x, y + 26, item.emoji, { fontSize: '44px' })
      .setOrigin(0.5, 1)
      .setDepth(10);
    const label = this.add
      .text(x, y - RISE - 20, noTouch ? `⚠️ ${item.label}: NO SE REMATA` : item.label, {
        fontFamily: FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: noTouch ? '#ff6b6b' : '#ffffff',
        backgroundColor: '#101018e6',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11)
      .setAlpha(0);
    const pop: Pop = { hole, item, noTouch, objects: [emoji, label], hit: false };
    this.pops.set(hole, pop);
    this.tweens.add({ targets: emoji, y: y - RISE, alpha: 1, duration: 120, ease: 'Quad.Out' });
    this.tweens.add({ targets: label, alpha: 1, duration: 140 });
    this.time.delayedCall(this.params.upMs, () => this.retract(hole));
  }

  private retract(hole: number, whacked = false): void {
    const pop = this.pops.get(hole);
    if (!pop || pop.hit) return;
    pop.hit = true;
    const { y } = this.holes[hole];
    for (const object of pop.objects) {
      this.tweens.add({
        targets: object,
        y: whacked ? y + 40 : y + 26,
        alpha: 0,
        duration: 110,
        onComplete: () => object.destroy(),
      });
    }
    this.pops.delete(hole);
  }

  private whackAt(pointer: Phaser.Input.Pointer): void {
    if (this.finished) return;
    for (const [hole, pop] of this.pops) {
      const { x, y } = this.holes[hole];
      const inX = Math.abs(pointer.worldX - x) < 70;
      const inY = pointer.worldY > y - RISE - 60 && pointer.worldY < y + 30;
      if (inX && inY) {
        this.retract(hole, true);
        this.log.push(pop.noTouch ? 'f' : 'h');
        this.score += pop.item.points;
        if (pop.noTouch) {
          this.foulCount += 1;
          sfx.crash();
          this.cameras.main.shake(160, 0.012);
          this.comicFx(x, y - 90, '¡NO SE REMATA!', '#ff3b30', 40);
        } else {
          this.hitCount += 1;
          sfx.punch();
          this.cameras.main.shake(90, 0.006);
          const words = this.spec.whackWords?.length ? this.spec.whackWords : DEFAULT_WORDS;
          this.comicFx(x, y - 86, Phaser.Utils.Array.GetRandom(words), '#ffd166', 38);
        }
        this.floatFx(x, y - 30, `${pop.item.label} ${pop.item.points > 0 ? '+' : ''}${pop.item.points}`);
        this.scoreText.setText(`Puntos: ${this.score}`);
        return;
      }
    }
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
      .setDepth(30)
      .setAngle(Phaser.Math.Between(-8, 8))
      .setScale(0.3);
    this.tweens.add({
      targets: comic,
      scale: 1,
      duration: 150,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: comic,
          y: comic.y - 22,
          alpha: 0,
          delay: 300,
          duration: 380,
          onComplete: () => comic.destroy(),
        });
      },
    });
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
      .setDepth(15);
    this.tweens.add({
      targets: label,
      y: y - 38,
      alpha: 0,
      duration: 700,
      onComplete: () => label.destroy(),
    });
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    sfx.end();
    const strip = this.log
      .slice(0, 30)
      .map((entry) => (entry === 'h' ? '🔨' : '⛔'))
      .join('');
    const verdicts =
      this.spec.verdicts && this.spec.verdicts.length === 4
        ? this.spec.verdicts
        : ['Se le escapó el martillo', 'Aprendiz de martillero', 'Martillero público', 'Rematador Mayor'];
    const tier = this.score < 0 ? 0 : this.score < 2500 ? 1 : this.score < 5000 ? 2 : 3;
    this.time.delayedCall(END_DELAY, () => {
      this.scene.start('Outro', {
        score: this.score,
        headline: 'SE TERMINÓ EL REMATE',
        stats: {
          landed: this.hitCount,
          received: this.foulCount,
          strip,
          verdict: verdicts[tier],
          difficulty: this.spec.difficulty,
        },
      });
    });
  }
}
