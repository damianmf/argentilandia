import Phaser from 'phaser';
import type { DecideOpcion, GameSpecDecide } from '../types';
import { applyTheme, hudColors } from '../engine/theme';
import { createPlayer, preloadPlayer } from '../engine/avatar';
import { sfx } from '../engine/audio';
import { popPoints, popText } from '../engine/juice';
import { tribuna } from '../engine/tribuna';

const FONT = 'system-ui, -apple-system, sans-serif';
const PAUSA_CONSECUENCIA = 1900;
const PAUSA_VEREDICTO = 2600;

interface Boton {
  rect: Phaser.GameObjects.Rectangle;
  texto: Phaser.GameObjects.Text;
  opcion: DecideOpcion;
}

export class Decide extends Phaser.Scene {
  private spec: GameSpecDecide;
  private scoreText!: Phaser.GameObjects.Text;
  private progresoText!: Phaser.GameObjects.Text;
  private panel?: Phaser.GameObjects.Container;
  private score = 0;
  private indice = 0;
  private eligiendo = false;

  constructor(spec: GameSpecDecide) {
    super('Decide');
    this.spec = spec;
  }

  preload(): void {
    preloadPlayer(this, this.spec);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.score = 0;
    this.indice = 0;
    this.eligiendo = false;

    createPlayer(this, this.spec, 300, 42, 44);
    this.scoreText = this.add.text(24, 16, 'Puntos: 0', {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors.score,
    });
    this.progresoText = this.add
      .text(this.scale.width - 24, 16, '', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: colors.time,
      })
      .setOrigin(1, 0);

    void tribuna(this, { y: 100, fontSize: 14, color: '#b8bdd4', fondoAlpha: 0.4 });

    this.mostrarEncuentro();
  }

  private mostrarEncuentro(): void {
    this.panel?.removeAll(true);
    this.panel?.destroy();
    const encuentro = this.spec.encuentros[this.indice];
    const cx = this.scale.width / 2;
    this.progresoText.setText(`DECISIÓN ${this.indice + 1}/${this.spec.encuentros.length}`);
    this.eligiendo = false;

    this.panel = this.add.container(0, 0);

    const titulo = this.add
      .text(cx, 128, `${encuentro.emoji}  ${encuentro.titulo}`, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 860 },
      })
      .setOrigin(0.5);
    const situacion = this.add
      .text(cx, 192, encuentro.situacion, {
        fontFamily: FONT,
        fontSize: '21px',
        color: '#cfcfe8',
        align: 'center',
        wordWrap: { width: 740 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.panel.add([titulo, situacion]);

    const alto = 86;
    const gap = 14;
    let y = 250 + alto / 2;
    const botones: Boton[] = [];
    for (const opcion of encuentro.opciones) {
      const rect = this.add
        .rectangle(cx, y, 780, alto, 0x2e2e4a, 1)
        .setStrokeStyle(2, 0x5a5a86)
        .setInteractive({ useHandCursor: true });
      const texto = this.add
        .text(cx, y, opcion.texto, {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: 720 },
        })
        .setOrigin(0.5);
      rect.on('pointerover', () => (rect.fillColor = 0x40406a));
      rect.on('pointerout', () => (rect.fillColor = 0x2e2e4a));
      rect.on('pointerup', () => this.elegir(botones, opcion));
      botones.push({ rect, texto, opcion });
      this.panel.add([rect, texto]);
      y += alto + gap;
    }
  }

  private elegir(botones: Boton[], opcion: DecideOpcion): void {
    if (this.eligiendo || !this.panel) return;
    this.eligiendo = true;
    for (const b of botones) {
      b.rect.disableInteractive();
      if (b.opcion !== opcion) {
        b.rect.fillColor = 0x1c1c2e;
        b.rect.alpha = 0.45;
        b.texto.alpha = 0.45;
      }
    }
    const buena = opcion.puntos >= 0;
    this.score += opcion.puntos;
    this.scoreText.setText(`Puntos: ${this.score}`);
    popText(this, this.scoreText);
    if (buena) sfx.catch();
    else sfx.crash();

    const elegido = botones.find((b) => b.opcion === opcion)!;
    elegido.rect.fillColor = buena ? 0x1f4a2f : 0x5a1f24;
    elegido.rect.setStrokeStyle(3, buena ? 0x7bed9f : 0xff6b6b);
    const cx = this.scale.width / 2;
    popPoints(this, cx, elegido.rect.y - 34, opcion.puntos);
    // La consecuencia vive en una franja fija al pie: nunca desborda el canvas.
    this.panel.add(
      this.add
        .text(cx, 574, opcion.consecuencia, {
          fontFamily: FONT,
          fontSize: '20px',
          fontStyle: 'italic',
          color: buena ? '#7bed9f' : '#ff6b6b',
          align: 'center',
          wordWrap: { width: 820 },
          backgroundColor: '#101018e6',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5)
        .setDepth(10),
    );

    this.time.delayedCall(PAUSA_CONSECUENCIA, () => {
      this.indice += 1;
      if (this.indice < this.spec.encuentros.length) this.mostrarEncuentro();
      else this.finalizar();
    });
  }

  private finalizar(): void {
    this.panel?.removeAll(true);
    const ordenados = [...this.spec.veredictos].sort((a, b) => b.min - a.min);
    const veredicto = ordenados.find((v) => this.score >= v.min) ?? ordenados[ordenados.length - 1];
    sfx.end();

    const cx = this.scale.width / 2;
    const velo = this.add
      .rectangle(cx, this.scale.height / 2, this.scale.width, this.scale.height, 0x05050a, 0.9)
      .setDepth(20);
    velo.setInteractive(); // tapa los botones viejos
    const cartel = this.add
      .container(cx, this.scale.height / 2, [
        this.add
          .text(0, -96, 'TU GESTIÓN', {
            fontFamily: FONT,
            fontSize: '26px',
            color: '#8f8fb0',
          })
          .setOrigin(0.5),
        this.add
          .text(0, -34, veredicto.titulo, {
            fontFamily: FONT,
            fontSize: '46px',
            fontStyle: 'bold',
            color: '#ffd166',
            align: 'center',
            wordWrap: { width: 860 },
          })
          .setOrigin(0.5),
        this.add
          .text(0, 66, veredicto.texto, {
            fontFamily: FONT,
            fontSize: '23px',
            color: '#e8e8ff',
            align: 'center',
            wordWrap: { width: 740 },
            lineSpacing: 7,
          })
          .setOrigin(0.5),
      ])
      .setDepth(21);
    cartel.setScale(0.4);
    this.tweens.add({ targets: cartel, scale: 1, duration: 380, ease: 'Back.Out' });

    this.time.delayedCall(PAUSA_VEREDICTO, () => {
      this.scene.start('Outro', { score: this.score, headline: veredicto.titulo });
    });
  }
}
