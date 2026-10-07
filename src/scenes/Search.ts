import Phaser from 'phaser';
import type { GameSpecSearch, SearchItem } from '../types';
import { searchParams } from '../engine/difficulty';
import { applyTheme, hudColors } from '../engine/theme';
import { sfx } from '../engine/audio';

const FONT = 'system-ui, -apple-system, sans-serif';
const CELL_CLOSED = 0x2e2e4a;
const CELL_CLOSED_HOVER = 0x40406a;
const CELL_EMPTY = 0x1c1c2e;
const CELL_FIND = 0x1f4a2f;
const CELL_TRAP = 0x5a1f24;
const CELL_STROKE = 0x4a4a72;
const AREA_TOP = 84;
const GAP = 6;
const END_DELAY = 700;

type CellContent = { kind: 'find'; item: SearchItem } | { kind: 'trap'; item: SearchItem } | { kind: 'empty' };

interface Cell {
  rect: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
  content: CellContent;
  revealed: boolean;
}

export class Search extends Phaser.Scene {
  private spec: GameSpecSearch;
  private params: ReturnType<typeof searchParams>;
  private cells: Cell[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private hitsText!: Phaser.GameObjects.Text;
  private touchesText!: Phaser.GameObjects.Text;
  private score = 0;
  private hits = 0;
  private touches = 0;
  private elapsed = 0;
  private totalFinds = 0;
  private finished = false;

  constructor(spec: GameSpecSearch) {
    super('Search');
    this.spec = spec;
    this.params = searchParams(spec.difficulty);
  }

  create(): void {
    applyTheme(this, this.spec);
    const colors = hudColors(this.spec);
    this.score = 0;
    this.hits = 0;
    this.touches = 0;
    this.elapsed = 0;
    this.finished = false;
    this.cells = [];

    this.scoreText = this.add.text(24, 16, '', {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: colors.score,
    });
    this.timeText = this.add
      .text(this.scale.width - 24, 16, '', {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: colors.time,
      })
      .setOrigin(1, 0);
    this.hitsText = this.add
      .text(this.scale.width * 0.44, 20, '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: colors.time,
      })
      .setOrigin(0.5, 0);
    this.touchesText = this.add
      .text(this.scale.width * 0.72, 20, '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: colors.time,
      })
      .setOrigin(0.5, 0);

    this.buildGrid();
    this.refreshHud();
  }

  update(_time: number, delta: number): void {
    if (this.finished) return;
    this.elapsed += delta;
    const remaining = Math.max(0, Math.ceil((this.spec.duration * 1000 - this.elapsed) / 1000));
    this.timeText.setText(`${remaining}s`);
    if (this.elapsed >= this.spec.duration * 1000) {
      this.finish('SE TERMINÓ EL TIEMPO');
    }
  }

  private buildGrid(): void {
    const cols = this.spec.grid.width;
    const rows = this.spec.grid.height;
    const total = cols * rows;
    const findCount = Math.max(1, Math.round(total * this.params.findRatio));
    const trapCount = Math.round(total * this.params.trapRatio);
    this.totalFinds = findCount;

    const contents: CellContent[] = [];
    for (let i = 0; i < findCount; i++) {
      contents.push({ kind: 'find', item: this.spec.find[i % this.spec.find.length] });
    }
    for (let i = 0; i < trapCount; i++) {
      contents.push({ kind: 'trap', item: this.spec.traps[i % this.spec.traps.length] });
    }
    while (contents.length < total) contents.push({ kind: 'empty' });
    Phaser.Utils.Array.Shuffle(contents);

    const areaWidth = this.scale.width - 48;
    const areaHeight = this.scale.height - AREA_TOP - 24;
    const cellSize = Math.min(areaWidth / cols, areaHeight / rows, 120);
    const boardWidth = cols * cellSize + (cols - 1) * GAP;
    const boardHeight = rows * cellSize + (rows - 1) * GAP;
    const startX = (this.scale.width - boardWidth) / 2 + cellSize / 2;
    const startY = AREA_TOP + (areaHeight - boardHeight) / 2 + cellSize / 2;

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cellSize + GAP);
      const y = startY + row * (cellSize + GAP);
      const rect = this.add
        .rectangle(x, y, cellSize, cellSize, CELL_CLOSED)
        .setStrokeStyle(2, CELL_STROKE)
        .setInteractive({ useHandCursor: true });
      const icon = this.add
        .text(x, y, '', { fontSize: `${Math.floor(cellSize * 0.5)}px` })
        .setOrigin(0.5)
        .setVisible(false);
      const cell: Cell = { rect, icon, content: contents[i], revealed: false };
      rect.on('pointerover', () => {
        if (!cell.revealed) rect.fillColor = CELL_CLOSED_HOVER;
      });
      rect.on('pointerout', () => {
        if (!cell.revealed) rect.fillColor = CELL_CLOSED;
      });
      rect.on('pointerup', () => this.reveal(cell));
      this.cells.push(cell);
    }
  }

  private reveal(cell: Cell): void {
    if (this.finished || cell.revealed) return;
    cell.revealed = true;
    cell.rect.disableInteractive();
    const { rect, icon, content } = cell;
    const x = rect.x;
    const y = rect.y;
    if (content.kind === 'empty') {
      rect.fillColor = CELL_EMPTY;
      icon.setText('·').setVisible(true).setColor('#55557a');
      return;
    }
    icon.setText(content.item.emoji).setVisible(true);
    this.float(x, y - rect.height * 0.35, this.floatLabel(content.item), '#ffffff');
    if (content.kind === 'find') {
      rect.fillColor = CELL_FIND;
      this.score += content.item.points;
      this.hits++;
      sfx.catch();
      if (this.hits >= this.totalFinds) {
        this.refreshHud();
        this.finish('¡ENCONTRASTE TODO!');
        return;
      }
    } else {
      rect.fillColor = CELL_TRAP;
      this.score += content.item.points;
      this.touches++;
      sfx.crash();
      this.cameras.main.shake(120, 0.006);
      if (this.touches >= this.spec.maxTouches) {
        this.refreshHud();
        this.finish('TE QUEDASTE SIN TOQUES');
        return;
      }
    }
    this.refreshHud();
  }

  private finish(headline: string): void {
    if (this.finished) return;
    this.finished = true;
    sfx.end();
    this.time.delayedCall(END_DELAY, () => {
      this.scene.start('Outro', { score: this.score, headline });
    });
  }

  private floatLabel(item: SearchItem): string {
    const sign = item.points > 0 ? '+' : '';
    return `${item.label} ${sign}${item.points}`;
  }

  private float(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
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
      y: y - 44,
      alpha: 0,
      duration: 900,
      onComplete: () => label.destroy(),
    });
  }

  private refreshHud(): void {
    this.scoreText.setText(`Puntos: ${this.score}`);
    this.hitsText.setText(`Aciertos: ${this.hits}/${this.totalFinds}`);
    this.touchesText.setText(`Toques: ${this.touches}/${this.spec.maxTouches}`);
  }
}
