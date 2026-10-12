import Phaser from 'phaser';
import type { GameSpec, SourceRef } from '../types';
import { SCENE_BY_GAME, urlGameId } from '../engine/routes';

const FONT = 'system-ui, -apple-system, sans-serif';
const LINK_COLOR = '#4a9bef';
const LINK_HOVER_COLOR = '#7ab8ff';
const BODY_COLOR = '#cfcfe8';
const HEADING_COLOR = '#ffffff';
const CONTENT_X = 60;
const CONTENT_WIDTH = 840;
const DRAG_THRESHOLD = 8;
const ACCENT = '#ffd166';

interface FightStats {
  landed: number;
  received: number;
  strip: string;
  verdict: string;
  difficulty: number;
}

interface Resumen {
  ranking: { apodo: string; score: number }[];
  comentarios: { apodo: string; comentario: string; fecha: string }[];
  totalJugadas: number;
  totalJugadores: number;
}

export class Outro extends Phaser.Scene {
  private spec: GameSpec;
  private score = 0;
  private headline = 'SE TERMINÓ EL TIEMPO';
  private stats?: FightStats;
  private content!: Phaser.GameObjects.Container;
  private viewport!: Phaser.Geom.Rectangle;
  private scrollY = 0;
  private maxScroll = 0;
  private dragging = false;
  private dragMoved = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private overlay: HTMLDivElement | null = null;
  private puestoTexto = '';

  constructor(spec: GameSpec) {
    super('Outro');
    this.spec = spec;
  }

  init(data: { score?: number; headline?: string; stats?: FightStats }): void {
    this.score = data.score ?? 0;
    this.headline = data.headline ?? 'SE TERMINÓ EL TIEMPO';
    this.stats = data.stats;
    this.scrollY = 0;
    this.dragging = false;
    this.dragMoved = false;
    this.puestoTexto = '';
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.spec.theme) {
      this.cameras.main.setBackgroundColor(this.spec.theme.background);
    }

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.add
      .text(width / 2, 46, this.headline, {
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

    let recordLine = '';
    if (this.stats) {
      const key = `record-${urlGameId()}${this.stats.difficulty >= 8 ? '-pro' : ''}`;
      try {
        const previous = Number(localStorage.getItem(key) ?? 0) || 0;
        if (this.score > previous) {
          localStorage.setItem(key, String(this.score));
          recordLine = '¡NUEVO RÉCORD LOCAL!';
        } else {
          recordLine = `Récord local: ${previous}`;
        }
      } catch {
        // sin localStorage no hay récord, el resto sigue
      }
      if (recordLine) {
        this.add
          .text(width / 2, 122, recordLine, {
            fontFamily: FONT,
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffd166',
          })
          .setOrigin(0.5);
      }
    }

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

    const rankingEntry = this.add
      .text(0, 0, '🏆 RANKING DEL DÍA — ANOTÁ TU PUNTAJE Y DEJÁ TU VEREDICTO', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: ACCENT,
        wordWrap: { width: CONTENT_WIDTH },
      })
      .setInteractive({ useHandCursor: true });
    rankingEntry.on('pointerover', () => rankingEntry.setColor('#ffe29a'));
    rankingEntry.on('pointerout', () => rankingEntry.setColor(ACCENT));
    rankingEntry.on('pointerup', () => {
      if (!this.dragMoved) this.abrirRanking();
    });
    push(rankingEntry, 26);

    this.events.once('shutdown', () => this.cerrarRanking());

    const heading = (text: string, color = HEADING_COLOR): Phaser.GameObjects.Text =>
      this.add
        .text(0, 0, text, {
          fontFamily: FONT,
          fontSize: '26px',
          fontStyle: 'bold',
          color,
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

    const quote = this.spec.outro.quote;
    if (quote) {
      push(heading('LA FRASE DEL DÍA', '#ffd166'), 12);
      const quoteText = this.add.text(0, 0, `"${quote.text}"`, {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'italic bold',
        color: HEADING_COLOR,
        wordWrap: { width: CONTENT_WIDTH },
        lineSpacing: 6,
      });
      push(quoteText, 6);
      push(
        this.add.text(0, 0, `— ${quote.who}`, {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#8f8fb0',
        }),
        6,
      );
      const quoted = this.spec.outro.sources.find((source) => source.url === quote.source);
      if (quoted) push(this.link(quoted), 26);
      else y += 26;
    }

    if (this.spec.outro.moments && this.spec.outro.moments.length > 0) {
      push(heading('MOMENTOS'), 10);
      for (const moment of this.spec.outro.moments) {
        push(body(`${moment.emoji} ${moment.text}`), 8);
      }
      y += 18;
    }

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

    const share = this.add
      .text(width / 2 - 215, height - 48, '📋 COMPARTIR', {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#218c5b',
        padding: { x: 30, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    share.on('pointerover', () => share.setBackgroundColor('#2aa871'));
    share.on('pointerout', () => share.setBackgroundColor('#218c5b'));
    share.on('pointerup', () => {
      const lines = [`${this.spec.emoji} ${this.spec.title} — ${this.score} pts`];
      if (this.stats) {
        lines.push(`"${this.stats.verdict}"${this.stats.difficulty >= 8 ? ' · PRO' : ''}`);
      }
      if (this.puestoTexto) {
        lines.push(`🏆 ${this.puestoTexto}`);
      }
      if (this.stats?.strip) {
        lines.push(this.stats.strip);
      }
      const quote = this.spec.outro.quote;
      if (quote) {
        lines.push(`"${quote.text}" — ${quote.who}`);
      }
      const gameId = urlGameId();
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      if (gameId && !isLocal) {
        lines.push(`▶ Jugálo acá: ${window.location.origin}/juego/${encodeURIComponent(gameId)}/`);
      }
      try {
        navigator.clipboard
          .writeText(lines.join('\n'))
          .then(() => {
            share.setText('¡COPIADO! ✓');
            window.setTimeout(() => share.setText('📋 COMPARTIR'), 1600);
          })
          .catch(() => share.setText('NO SE PUDO COPIAR'));
      } catch {
        share.setText('NO SE PUDO COPIAR');
      }
    });

    const replay = this.add
      .text(width / 2 + 200, height - 48, 'VOLVER A JUGAR', {
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
    replay.on('pointerup', () => this.scene.start(SCENE_BY_GAME[this.spec.game]));
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

  // --- Ranking del día: overlay DOM sobre el canvas (apodo + veredicto + puesto) ---

  private abrirRanking(): void {
    if (this.overlay) return;
    if (!urlGameId()) return;
    if (this.input.keyboard) this.input.keyboard.enabled = false;

    const panel = document.createElement('div');
    panel.style.cssText = [
      'background:#101018',
      'border:1px solid #262636',
      'border-top:4px solid #ffd166',
      'border-radius:14px',
      'padding:22px 24px',
      'width:min(540px, 92vw)',
      'max-height:88vh',
      'overflow-y:auto',
      'color:#ffffff',
      'font-family:system-ui,-apple-system,sans-serif',
    ].join(';');

    const titulo = document.createElement('h3');
    titulo.textContent = `🏆 ${this.spec.ranking?.titulo ?? 'RANKING DEL DÍA'}`;
    titulo.style.cssText = 'margin:0 0 4px;font-size:19px;letter-spacing:2px';
    panel.appendChild(titulo);

    const puntaje = document.createElement('p');
    puntaje.textContent = `Tu puntaje: ${this.score}${this.spec.ranking?.unidad ? ` ${this.spec.ranking.unidad}` : ' pts'}`;
    puntaje.style.cssText = 'margin:0 0 14px;color:#9aa0b5;font-size:14px';
    panel.appendChild(puntaje);

    const campo = (placeholder: string, max: number, multilinea: boolean): HTMLInputElement | HTMLTextAreaElement => {
      let c: HTMLInputElement | HTMLTextAreaElement;
      if (multilinea) {
        c = document.createElement('textarea');
        c.style.height = '64px';
        c.style.resize = 'none';
      } else {
        c = document.createElement('input');
        c.type = 'text';
      }
      c.placeholder = placeholder;
      c.maxLength = max;
      c.style.cssText = [
        'width:100%',
        'box-sizing:border-box',
        'background:#05050a',
        'border:1px solid #262636',
        'border-radius:8px',
        'color:#ffffff',
        'padding:10px 12px',
        'font-size:14px',
        'font-family:inherit',
        'margin-bottom:10px',
      ].join(';');
      panel.appendChild(c);
      return c;
    };

    const apodo = campo('TU APODO', 24, false) as HTMLInputElement;
    try {
      apodo.value = localStorage.getItem('apodo') ?? '';
    } catch {
      // sin localStorage, el apodo se escribe de nuevo
    }
    const comentario = campo('TU VEREDICTO (opcional): ¿qué te pareció el día?', 200, true);

    const nota = document.createElement('p');
    nota.textContent = 'Queda público tu apodo, tu puntaje y tu veredicto. Nada más.';
    nota.style.cssText = 'margin:0 0 14px;color:#6b7085;font-size:12px';
    panel.appendChild(nota);

    const fila = document.createElement('div');
    fila.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';
    const boton = (texto: string, fondo: string, accion: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = texto;
      b.style.cssText = `background:${fondo};border:none;border-radius:8px;color:#ffffff;font-weight:700;font-size:14px;letter-spacing:1px;padding:10px 18px;cursor:pointer;font-family:inherit`;
      b.onclick = accion;
      fila.appendChild(b);
      return b;
    };
    const mandar = boton('MANDAR AL RANKING', '#218c5b', () => enviar());
    boton('DESPUÉS', '#262636', () => this.cerrarRanking());
    panel.appendChild(fila);

    const mensaje = document.createElement('p');
    mensaje.style.cssText = 'margin:12px 0 0;color:#ff6b6b;font-size:13px;min-height:16px';
    panel.appendChild(mensaje);

    const enviar = async (): Promise<void> => {
      mensaje.style.color = '#9aa0b5';
      mensaje.textContent = 'MANDANDO…';
      mandar.disabled = true;
      mandar.style.opacity = '0.6';
      const gameId = urlGameId() ?? '';
      try {
        const r = await fetch(`/api/juegos/${encodeURIComponent(gameId)}/partidas`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ apodo: apodo.value, score: this.score, comentario: comentario.value }),
        });
        const data = (await r.json().catch(() => null)) as { ok?: boolean; puesto?: number; totalJugadores?: number; error?: string } | null;
        if (!r.ok || !data?.ok) {
          mensaje.style.color = '#ff6b6b';
          mensaje.textContent = data?.error ?? 'NO SE PUDO ANOTAR: probá de nuevo';
          mandar.disabled = false;
          mandar.style.opacity = '1';
          return;
        }
        try {
          localStorage.setItem('apodo', apodo.value.trim());
        } catch {
          // sin localStorage no hay apodo recordado, el resto sigue
        }
        await this.mostrarPuesto(panel, data.puesto ?? 1, data.totalJugadores ?? 1);
      } catch {
        mensaje.style.color = '#ff6b6b';
        mensaje.textContent = 'RANKING NO DISPONIBLE ACÁ (sin backend). El juego sigue igual.';
        mandar.disabled = false;
        mandar.style.opacity = '1';
      }
    };

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(5,5,10,0.88)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:1000',
    ].join(';');
    this.overlay.appendChild(panel);
    document.body.appendChild(this.overlay);
  }

  private async mostrarPuesto(panel: HTMLDivElement, puesto: number, totalJugadores: number): Promise<void> {
    const tituloSatirico = (): string => {
      const titulos = this.spec.ranking?.titulos ?? [];
      if (titulos.length === 0) return '';
      const indice = totalJugadores <= 1 ? 0 : Math.min(titulos.length - 1, Math.floor(((puesto - 1) / totalJugadores) * titulos.length));
      return ` — ${titulos[indice]}`;
    };
    this.puestoTexto = `N°${puesto} de ${totalJugadores}${tituloSatirico()}`;

    const gameId = urlGameId() ?? '';
    panel.innerHTML = '';

    const puestoLinea = document.createElement('h3');
    puestoLinea.textContent = `N° ${puesto} DE ${totalJugadores}`;
    puestoLinea.style.cssText = 'margin:0 0 2px;font-size:30px;color:#ffd166;letter-spacing:2px';
    panel.appendChild(puestoLinea);

    const sub = document.createElement('p');
    sub.textContent = `${this.spec.ranking?.titulo ?? 'RANKING DEL DÍA'}${tituloSatirico()}`;
    sub.style.cssText = 'margin:0 0 16px;font-size:14px;color:#c6cad8';
    panel.appendChild(sub);

    const mensaje = document.createElement('p');
    mensaje.style.cssText = 'margin:0 0 12px;color:#9aa0b5;font-size:13px';
    panel.appendChild(mensaje);

    try {
      const r = await fetch(`/api/juegos/${encodeURIComponent(gameId)}/resumen`);
      if (!r.ok) throw new Error('resumen no disponible');
      const data = (await r.json()) as Resumen;
      mensaje.textContent = `${data.totalJugadas} ${data.totalJugadas === 1 ? 'partida jugada' : 'partidas jugadas'}`;

      if (data.ranking.length > 0) {
        const titulo = document.createElement('p');
        titulo.textContent = 'EL ESCALAFÓN';
        titulo.style.cssText = 'margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:2px;color:#ffd166';
        panel.appendChild(titulo);
        data.ranking.forEach((fila, i) => {
          const linea = document.createElement('p');
          linea.textContent = `${i + 1}. ${fila.apodo} — ${fila.score}`;
          linea.style.cssText = 'margin:0 0 4px;font-size:14px;color:#cfcfe8';
          panel.appendChild(linea);
        });
      }

      const tituloVeredictos = document.createElement('p');
      tituloVeredictos.textContent = 'LOS VEREDICTOS';
      tituloVeredictos.style.cssText = 'margin:14px 0 6px;font-size:13px;font-weight:700;letter-spacing:2px;color:#ffd166';
      panel.appendChild(tituloVeredictos);

      if (data.comentarios.length === 0) {
        const vacio = document.createElement('p');
        vacio.textContent = 'Todavía no hay veredictos. El tuyo es el primero.';
        vacio.style.cssText = 'margin:0;font-size:14px;color:#6b7085';
        panel.appendChild(vacio);
      } else {
        for (const c of data.comentarios.slice(0, 8)) {
          const linea = document.createElement('p');
          linea.textContent = `${c.apodo}: "${c.comentario}"`;
          linea.style.cssText = 'margin:0 0 6px;font-size:14px;color:#cfcfe8;font-style:italic';
          panel.appendChild(linea);
        }
      }
    } catch {
      mensaje.textContent = 'No pude traer el escalafón completo (¿sin backend acá?).';
    }

    const fila = document.createElement('div');
    fila.style.cssText = 'display:flex;gap:10px;margin-top:16px';
    const seguir = document.createElement('button');
    seguir.textContent = 'SEGUIR';
    seguir.style.cssText =
      'background:#ffd166;border:none;border-radius:8px;color:#05050a;font-weight:700;font-size:14px;letter-spacing:1px;padding:10px 22px;cursor:pointer;font-family:inherit';
    seguir.onclick = () => this.cerrarRanking();
    fila.appendChild(seguir);
    panel.appendChild(fila);
  }

  private cerrarRanking(): void {
    this.overlay?.remove();
    this.overlay = null;
    if (this.input.keyboard) this.input.keyboard.enabled = true;
  }
}
