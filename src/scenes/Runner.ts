import Phaser from 'phaser';
import type { CatchObject, GameSpecRunner } from '../types';
import { runnerParams } from '../engine/difficulty';
import { applyTheme, hudColors } from '../engine/theme';
import { createPlayer, preloadPlayer, type PlayerSprite } from '../engine/avatar';
import { sfx } from '../engine/audio';

const FONT = 'system-ui, -apple-system, sans-serif';
const FLOOR_Y = 552;
const PLAYER_X = 140;
const SPAWN_X = 1020;
const JUMP_VELOCITY = -680;
const GRAVITY = 1900;
const DUCK_SCALE = 0.55;
const OBSTACLE_SIZE = 48;
const PRIZE_SIZE = 40;
const DUCK_CLEARANCE = 38;
const DISTANCE_RATE = 0.1;
const TICK_GAP = 90;
const TICK_COLOR = 0x3a3a5e;
const GROUND_COLOR = 0x20203a;

type SpawnKind = 'jump' | 'duck' | 'prize';

interface Spawned {
  obj: Phaser.GameObjects.Text;
  item: CatchObject;
  kind: SpawnKind;
  done: boolean;
}

export class Runner extends Phaser.Scene {
  private spec: GameSpecRunner;
  private params: ReturnType<typeof runnerParams>;
  private player!: PlayerSprite;
  private baseHeight = 0;
  private baseScaleY = 1;
  private standY = 0;
  private velocityY = 0;
  private grounded = true;
  private ducking = false;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private spawned: Spawned[] = [];
  private ticks: Phaser.GameObjects.Rectangle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private score = 0;
  private bonus = 0;
  private distance = 0;
  private elapsed = 0;
  private finished = false;

  constructor(spec: GameSpecRunner) {
    super('Runner');
    this.spec = spec;
    this.params = runnerParams(spec.difficulty);
  }

  preload(): void {
    preloadPlayer(this, this.spec);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addCapture('SPACE,UP,DOWN');
    this.input.mouse?.disableContextMenu();
    this.spawned = [];
    this.ticks = [];
    this.score = 0;
    this.bonus = 0;
    this.distance = 0;
    this.elapsed = 0;
    this.finished = false;
    this.grounded = true;
    this.ducking = false;
    this.velocityY = 0;

    this.add.rectangle(0, FLOOR_Y, this.scale.width, this.scale.height - FLOOR_Y, GROUND_COLOR).setOrigin(0);
    this.buildTicks();

    this.player = createPlayer(this, this.spec, PLAYER_X, 0);
    this.baseHeight = this.player.height;
    this.baseScaleY = this.player.scaleY;
    this.standY = FLOOR_Y - this.baseHeight / 2;
    this.player.y = this.standY;

    this.scoreText = this.add.text(24, 16, this.hudScore(), {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors.score,
    });

    this.timeText = this.add
      .text(this.scale.width - 24, 16, `${this.spec.duration}s`, {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: colors.time,
      })
      .setOrigin(1, 0);

    this.time.addEvent({
      delay: this.params.spawnInterval,
      loop: true,
      callback: this.spawn,
      callbackScope: this,
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.rightButtonDown()) this.jump();
    });
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;
    const dt = delta / 1000;

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.jump();
    }

    if (!this.grounded) {
      this.velocityY += GRAVITY * dt;
      this.player.y += this.velocityY * dt;
      if (this.player.y >= this.standY) {
        this.player.y = this.standY;
        this.grounded = true;
        this.velocityY = 0;
      }
    }
    this.applyDuck(this.grounded && this.duckHeld());

    this.distance += this.params.speed * dt;
    const distanceScore = Math.floor(this.distance * DISTANCE_RATE);
    const newScore = distanceScore + this.bonus;
    if (newScore !== this.score) {
      this.score = newScore;
      this.scoreText.setText(this.hudScore());
    }

    this.elapsed += delta;
    const remaining = Math.max(0, Math.ceil((this.spec.duration * 1000 - this.elapsed) / 1000));
    this.timeText.setText(`${remaining}s`);
    if (this.elapsed >= this.spec.duration * 1000) {
      this.finish();
      return;
    }

    for (const spawn of [...this.spawned]) {
      if (spawn.done) continue;
      spawn.obj.x -= this.params.speed * dt;
      if (spawn.obj.x < -60) {
        this.remove(spawn);
        continue;
      }
      const dx = Math.abs(spawn.obj.x - this.player.x);
      const dy = Math.abs(spawn.obj.y - this.player.y);
      const reachX = ((spawn.obj.displayWidth + this.player.displayWidth) / 2) * 0.55;
      const reachY = ((spawn.obj.displayHeight + this.player.displayHeight) / 2) * 0.55;
      if (dy < reachY && dx < reachX) {
        if (spawn.kind === 'prize') this.collect(spawn);
        else this.crash(spawn);
      }
    }
    for (const tick of this.ticks) {
      tick.x -= this.params.speed * dt;
      if (tick.x < -TICK_GAP) tick.x += this.scale.width + TICK_GAP;
    }
  }

  private buildTicks(): void {
    for (let x = TICK_GAP; x < this.scale.width + TICK_GAP; x += TICK_GAP) {
      const tick = this.add.rectangle(x, FLOOR_Y + 24, 26, 4, TICK_COLOR).setOrigin(0.5);
      this.ticks.push(tick);
    }
  }

  private duckHeld(): boolean {
    return this.cursors.down.isDown || this.input.activePointer.rightButtonDown();
  }

  private jump(): void {
    if (this.finished || !this.grounded) return;
    this.grounded = false;
    this.velocityY = JUMP_VELOCITY;
    this.applyDuck(false);
  }

  private applyDuck(duck: boolean): void {
    if (duck === this.ducking) return;
    this.ducking = duck;
    this.player.scaleY = this.baseScaleY * (duck ? DUCK_SCALE : 1);
    this.player.y = duck ? FLOOR_Y - (this.baseHeight * DUCK_SCALE) / 2 : this.standY;
  }

  private spawn(): void {
    if (this.finished) return;
    if (Math.random() < this.params.prizeRatio) this.spawnPrize();
    else this.spawnObstacle();
  }

  private spawnObstacle(): void {
    const item = weightedPick(this.spec.obstacles);
    const y =
      item.kind === 'jump' ? FLOOR_Y - OBSTACLE_SIZE / 2 : FLOOR_Y - DUCK_CLEARANCE - OBSTACLE_SIZE / 2;
    const obj = this.add.text(SPAWN_X, y, item.emoji, { fontSize: `${OBSTACLE_SIZE}px` }).setOrigin(0.5);
    this.spawned.push({ obj, item, kind: item.kind, done: false });
  }

  private spawnPrize(): void {
    const item = weightedPick(this.spec.prizes);
    const y = Phaser.Math.Between(FLOOR_Y - 160, FLOOR_Y - 70);
    const obj = this.add.text(SPAWN_X, y, item.emoji, { fontSize: `${PRIZE_SIZE}px` }).setOrigin(0.5);
    this.spawned.push({ obj, item, kind: 'prize', done: false });
  }

  private collect(spawn: Spawned): void {
    spawn.done = true;
    this.bonus += spawn.item.points;
    sfx.catch();
    this.float(spawn.obj.x, spawn.obj.y, label(spawn.item), '#7bed9f');
    this.tweens.add({
      targets: spawn.obj,
      scale: spawn.obj.scale * 1.6,
      alpha: 0,
      duration: 180,
      onComplete: () => this.remove(spawn),
    });
  }

  private crash(spawn: Spawned): void {
    spawn.done = true;
    this.bonus += spawn.item.points;
    sfx.crash();
    this.cameras.main.shake(120, 0.006);
    this.float(spawn.obj.x, spawn.obj.y, label(spawn.item), '#ff6b6b');
    this.tweens.add({
      targets: this.player,
      alpha: 0.2,
      yoyo: true,
      duration: 90,
    });
    this.tweens.add({
      targets: spawn.obj,
      scale: spawn.obj.scale * 1.6,
      alpha: 0,
      duration: 180,
      onComplete: () => this.remove(spawn),
    });
  }

  private remove(spawn: Spawned): void {
    spawn.obj.destroy();
    this.spawned = this.spawned.filter((s) => s !== spawn);
  }

  private finish(): void {
    this.finished = true;
    sfx.end();
    this.scene.start('Outro', { score: this.score });
  }

  private float(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y - 20, text, {
        fontFamily: FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color,
        backgroundColor: '#101018e6',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: label,
      y: y - 64,
      alpha: 0,
      duration: 900,
      onComplete: () => label.destroy(),
    });
  }

  private hudScore(): string {
    return `Puntos: ${this.score}`;
  }
}

function weightedPick<T extends CatchObject>(pool: T[]): T {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
}

function label(item: CatchObject): string {
  const sign = item.points > 0 ? '+' : '';
  return `${item.label} ${sign}${item.points}`;
}
