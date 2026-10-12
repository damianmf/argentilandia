import Phaser from 'phaser';

const FONT = 'system-ui, -apple-system, sans-serif';
const GOOD = '#7dffa8';
const BAD = '#ff7d7d';
const DANGER = '#ff6b6b';

type PopTarget = Phaser.GameObjects.Text | Phaser.GameObjects.Image;

// Hit-stop compartido: congela el mundo unos ms tras cada impacto (los tweens
// de feedback siguen, el reloj del juego no avanza).
export class HitStop {
  private remain = 0;

  stop(ms: number): void {
    this.remain = Math.max(this.remain, ms);
  }

  /** Devuelve true mientras el mundo debe quedar congelado. */
  drain(delta: number): boolean {
    if (this.remain <= 0) return false;
    this.remain = Math.max(0, this.remain - delta);
    return true;
  }
}

export function popPoints(scene: Phaser.Scene, x: number, y: number, points: number): void {
  const good = points >= 0;
  const label = scene.add
    .text(x, y, `${good ? '+' : ''}${points}`, {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: good ? GOOD : BAD,
      stroke: '#101018',
      strokeThickness: 5,
    })
    .setOrigin(0.5)
    .setDepth(10)
    .setScale(0.6);
  scene.tweens.add({ targets: label, scale: 1.15, duration: 110, ease: 'Back.Out' });
  scene.tweens.add({
    targets: label,
    y: y - 44,
    alpha: 0,
    delay: 130,
    duration: 520,
    onComplete: () => label.destroy(),
  });
}

export function hitPop(scene: Phaser.Scene, target: PopTarget): void {
  const base = target.scale;
  scene.tweens.add({ targets: target, scale: base * 1.25, yoyo: true, duration: 90, ease: 'Quad.Out' });
}

export function popText(scene: Phaser.Scene, target: Phaser.GameObjects.Text): void {
  scene.tweens.add({ targets: target, scale: 1.2, yoyo: true, duration: 80 });
}

/** Últimos 10 segundos: rojo + pulso por segundo. Llamar solo cuando cambia el segundo. */
export function tickTime(scene: Phaser.Scene, text: Phaser.GameObjects.Text, remaining: number, baseColor: string): void {
  const danger = remaining > 0 && remaining <= 10;
  text.setColor(danger ? DANGER : baseColor);
  if (danger) popText(scene, text);
}
