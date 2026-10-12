import Phaser from 'phaser';
import type { GameSpec, GameSpecFighter } from '../types';
import { applyTheme } from '../engine/theme';
import { createAvatarSprite, createPlayer, preloadAvatarImage, preloadPlayer, RIVAL_KEY } from '../engine/avatar';
import { initAudio } from '../engine/audio';
import { SCENE_BY_GAME, urlGameId } from '../engine/routes';

const FONT = 'system-ui, -apple-system, sans-serif';

interface ResumenTitulo {
  comentarios: { apodo: string; comentario: string }[];
  totalJugadas: number;
}

export class Title extends Phaser.Scene {
  private spec: GameSpec;
  private revancha: number;

  constructor(spec: GameSpec, revancha = 0) {
    super('Title');
    this.spec = spec;
    this.revancha = revancha;
  }

  preload(): void {
    preloadPlayer(this, this.spec);
    if (this.spec.game === 'fighter') {
      preloadAvatarImage(this, RIVAL_KEY, this.spec.rival.image);
    }
  }

  create(): void {
    const cx = this.scale.width / 2;

    applyTheme(this, this.spec);

    const title = this.add
      .text(cx, 90, this.spec.title, {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 880 },
      })
      .setOrigin(0.5);
    // Los títulos los genera el pipeline: que entre siempre, sea lo largo que sea.
    const titleStartScale = Math.min(2.6, (this.scale.width - 40) / title.width);
    title.setScale(titleStartScale);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => this.cameras.main.shake(140, 0.008),
    });

    if (this.spec.game === 'fighter') {
      this.attractFight(cx, this.spec);
    } else {
      const avatar = createPlayer(this, this.spec, cx, 225, this.spec.player.image ? 130 : 96);
      avatar.setScale(avatar.scaleY * 0.4);
      this.tweens.add({
        targets: avatar,
        scaleY: avatar.scaleY * (1 / 0.4),
        scaleX: avatar.scaleX * (1 / 0.4),
        duration: 420,
        delay: 180,
        ease: 'Back.Out',
      });
    }

    this.add
      .text(cx, 350, this.spec.intro, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#cfcfe8',
        align: 'center',
        wordWrap: { width: 760 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 450, `Duración: ${this.spec.duration} segundos`, {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#8f8fb0',
      })
      .setOrigin(0.5);

    const record = this.localRecord();
    if (record > 0) {
      this.add
        .text(cx, 480, `⭐ RÉCORD LOCAL: ${record}`, {
          fontFamily: FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5);
    }

    if (this.revancha > 0) {
      this.add
        .text(cx, record > 0 ? 504 : 480, `⚔️ TE DESAFIARON: ${this.revancha} PTS — ¿PODÉS SUPERARLO?`, {
          fontFamily: FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ff6b6b',
        })
        .setOrigin(0.5);
    }

    const start = (difficulty?: number): void => {
      initAudio(this.spec.sound === true);
      // En teléfono (gesture de tap): fullscreen + lock landscape donde exista
      // (Android); iOS y desktop no lo soportan y siguen por el camino normal.
      if (window.matchMedia('(pointer: coarse)').matches) {
        const lock = (
          screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
        ).lock;
        document.documentElement.requestFullscreen
          ?.()
          .then(() => lock?.('landscape'))
          .catch(() => {});
      }
      this.scene.start(SCENE_BY_GAME[this.spec.game], difficulty ? { difficulty } : undefined);
    };

    if (this.spec.game === 'fighter') {
      const play = this.add
        .text(cx - 95, 535, 'JUGAR', {
          fontFamily: FONT,
          fontSize: '32px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#2e86de',
          padding: { x: 40, y: 16 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      play.on('pointerover', () => play.setBackgroundColor('#4a9bef'));
      play.on('pointerout', () => play.setBackgroundColor('#2e86de'));
      play.on('pointerup', () => start());

      const pro = this.add
        .text(cx + 110, 535, 'PRO 🔥', {
          fontFamily: FONT,
          fontSize: '32px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#c0392b',
          padding: { x: 34, y: 16 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      pro.on('pointerover', () => pro.setBackgroundColor('#e04a38'));
      pro.on('pointerout', () => pro.setBackgroundColor('#c0392b'));
      pro.on('pointerup', () => start(10));
    } else {
      const play = this.add
        .text(cx, 530, 'JUGAR', {
          fontFamily: FONT,
          fontSize: '32px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#2e86de',
          padding: { x: 40, y: 16 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      play.on('pointerover', () => play.setBackgroundColor('#4a9bef'));
      play.on('pointerout', () => play.setBackgroundColor('#2e86de'));
      play.on('pointerup', () => start());
    }

    this.cargarVeredictos(this.scale.width);
  }

  // Prueba social al entrar: los veredictos de los jugadores corren como ticker
  // en el borde inferior del título. Sin backend o sin comentarios, no aparece.
  private cargarVeredictos(width: number): void {
    const gameId = urlGameId();
    if (!gameId) return;
    void (async () => {
      try {
        const r = await fetch(`/api/juegos/${encodeURIComponent(gameId)}/resumen`);
        if (!r.ok) return;
        const data = (await r.json()) as ResumenTitulo;
        if (!this.scene.isActive('Title') || data.comentarios.length === 0) return;

        const partes = [`🏁 ${data.totalJugadas} ${data.totalJugadas === 1 ? 'partida' : 'partidas'} jugadas`];
        for (const c of data.comentarios.slice(0, 10)) {
          partes.push(`💬 ${c.apodo}: "${c.comentario}"`);
        }
        const texto = partes.join('   ·   ');

        const strip = this.add.rectangle(width / 2, 589, width, 26, 0x05050a, 0.62);
        const estilo = { fontFamily: FONT, fontSize: '15px', color: '#c6cad8' };
        const mitad = this.add.text(0, 0, texto, estilo).setOrigin(0, 0.5);
        const tira = this.add.container(0, 589, [mitad, this.add.text(mitad.width, 0, texto, estilo).setOrigin(0, 0.5)]);
        strip.setDepth(0);
        tira.setDepth(1);
        // La tira tiene el texto dos veces: al correr un ancho exacto, el loop es seamless.
        this.tweens.add({
          targets: tira,
          x: -mitad.width,
          duration: Math.max(14000, mitad.width * 16),
          repeat: -1,
          ease: 'Linear',
        });
      } catch {
        // sin backend acá: la pantalla de título queda como siempre
      }
    })();
  }

  private attractFight(cx: number, spec: GameSpecFighter): void {
    const y = 182;
    const left = createPlayer(this, spec, cx - 160, y, 70);
    const right = createAvatarSprite(this, RIVAL_KEY, spec.rival.emoji, cx + 160, y, 70);
    if ('setFlipX' in right) right.setFlipX(true);
    for (const sprite of [left, right]) {
      sprite.setScale(sprite.scaleY * 0.4);
      this.tweens.add({
        targets: sprite,
        scaleY: sprite.scaleY * (1 / 0.4),
        scaleX: sprite.scaleX * (1 / 0.4),
        duration: 420,
        delay: 180,
        ease: 'Back.Out',
      });
    }
    this.tweens.add({ targets: left, x: cx + 95, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: right, x: cx - 95, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const words = [...(spec.punchWords ?? []), ...(spec.rivalWords ?? []), '¡PUM!', '¡ZAS!'];
    this.time.addEvent({
      delay: 950,
      loop: true,
      callback: () => {
        const comic = this.add
          .text(cx + Phaser.Math.Between(-160, 160), y - Phaser.Math.Between(24, 58), Phaser.Utils.Array.GetRandom(words), {
            fontFamily: FONT,
            fontSize: '25px',
            fontStyle: 'bold',
            color: Phaser.Utils.Array.GetRandom(['#ffd166', '#ff6b6b', '#ffffff']),
            stroke: '#101018',
            strokeThickness: 4,
            padding: { x: 5, y: 2 },
          })
          .setOrigin(0.5)
          .setAlpha(0.6)
          .setAngle(Phaser.Math.Between(-9, 9));
        this.tweens.add({
          targets: comic,
          y: comic.y - 18,
          alpha: 0,
          duration: 780,
          onComplete: () => comic.destroy(),
        });
      },
    });
  }

  private localRecord(): number {
    try {
      return Number(localStorage.getItem(`record-${urlGameId()}`) ?? 0) || 0;
    } catch {
      return 0;
    }
  }
}
