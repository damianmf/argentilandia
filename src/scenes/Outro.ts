import Phaser from 'phaser';
import type { GameSpec, SourceRef } from '../types';

const FONT = 'system-ui, -apple-system, sans-serif';
const LINK_COLOR = '#4a9bef';
const LINK_HOVER_COLOR = '#7ab8ff';
const BODY_COLOR = '#cfcfe8';
const HEADING_COLOR = '#ffffff';
const CONTENT_X = 60;
const CONTENT_WIDTH = 840;
const DRAG_THRESHOLD = 8;

export class Outro extends Phaser.Scene {
  private spec: GameSpec;
  private score = 0;
  private content!: Phaser.GameObjects.Container;
  private viewport!: Phaser.Geom.Rectangle;
  private scrollY = 0;
  private maxScroll = 0;
  private dragging = false;
  private dragMoved = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(spec: GameSpec) {
    super('Outro');
    this.spec = spec;
  }

  init(data: { score?: number }): void {
    this.score = data.score ?? 0;
    this.scrollY = 0;
    this.dragging = false;
    this.dragMoved = false;
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.add
      .text(width / 2, 46, 'SE TERMINÓ EL TIEMPO', {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const color = this.score < 0 ? '#ff6b6b' : '#7bed9f';
    this.add
      .text(width / 2, 94, `Puntaje final: ${this.score}`, {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color,
      })
      .setOrigin(0.5);

    const viewTop = 130;
    const viewBottom = height - 96;
    this.viewport = new Phaser.Geom.Rectangle(0, viewTop, width, viewBottom - viewTop);

    this.content = this.add.container(0, viewTop);
    let y = 0;
    const push = (text: Phaser.GameObjects.Text, gap: number): void => {
      text.setPosition(CONTENT_X, y);
      this.content.add(text);
      y += text.height + gap;
    };

    const heading = (text: string): Phaser.GameObjects.Text =>
      this.add
        .text(0, 0, text, {
          fontFamily: FONT,
          fontSize: '26px',
          fontStyle: 'bold',
          color: HEADING_COLOR,
        })
        .setName('heading');

    const body = (text: string): Phaser.GameObjects.Text =>
      this.add.text(0, 0, text, {
        fontFamily: FONT,
        fontSize: '20px',
        color: BODY_COLOR,
        wordWrap: { width: CONTENT_WIDTH },
        lineSpacing: 6,
      });

    push(heading('¿QUÉ PASÓ REALMENTE?'), 10);
    push(body(this.spec.outro.whatHappened), 26);

    push(heading('¿QUÉ SABEMOS?'), 10);
    for (const fact of this.spec.outro.facts) {
      push(body(`• ${fact}`), 8);
    }
    y += 18;

    push(heading('¿QUÉ ES FICCIÓN?'), 10);
    push(body(this.spec.outro.fiction), 26);

    push(heading('FUENTES:'), 10);
    for (const source of this.spec.outro.sources) {
      push(this.link(source), 8);
    }

    this.maxScroll = Math.max(0, y - this.viewport.height);

    const maskImage = this.make.graphics();
    maskImage.fillRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
    this.content.setMask(maskImage.createGeometryMask());

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.5);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragMoved = false;
      this.dragStartY = pointer.y;
      this.dragStartScroll = this.scrollY;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const delta = this.dragStartY - pointer.y;
      if (Math.abs(delta) > DRAG_THRESHOLD) this.dragMoved = true;
      this.scrollY = Phaser.Math.Clamp(this.dragStartScroll + delta, 0, this.maxScroll);
      this.content.y = this.viewport.y - this.scrollY;
    });
    this.input.on('pointerup', () => {
      this.dragging = false;
    });

    const replay = this.add
      .text(width / 2, height - 48, 'VOLVER A JUGAR', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#2e86de',
        padding: { x: 40, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    replay.on('pointerover', () => replay.setBackgroundColor('#4a9bef'));
    replay.on('pointerout', () => replay.setBackgroundColor('#2e86de'));
    replay.on('pointerup', () => this.scene.start('Title'));
  }

  update(_time: number, delta: number): void {
    const step = (delta / 1000) * 600;
    if (this.cursors.up.isDown) this.scrollBy(-step);
    if (this.cursors.down.isDown) this.scrollBy(step);
  }

  private scrollBy(amount: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + amount, 0, this.maxScroll);
    this.content.y = this.viewport.y - this.scrollY;
  }

  private link(source: SourceRef): Phaser.GameObjects.Text {
    const label = source.outlet ? `${source.title} — ${source.outlet}` : source.title;
    const text = this.add
      .text(0, 0, `🔗 ${label}`, {
        fontFamily: FONT,
        fontSize: '20px',
        color: LINK_COLOR,
        wordWrap: { width: CONTENT_WIDTH },
      })
      .setInteractive({ useHandCursor: true });

    text.on('pointerover', () => text.setColor(LINK_HOVER_COLOR));
    text.on('pointerout', () => text.setColor(LINK_COLOR));
    text.on('pointerup', () => {
      if (this.dragMoved) return;
      window.open(source.url, '_blank', 'noopener');
    });
    return text;
  }
}
