import Phaser from 'phaser';
import { urlGameId } from './routes';

const FONT = 'system-ui, -apple-system, sans-serif';

interface ResumenTribuna {
  comentarios: { apodo: string; comentario: string }[];
  totalJugadas: number;
}

export interface TribunaOpciones {
  y: number;
  fontSize?: number;
  color?: string;
  /** Alpha de la tira de fondo; 0 = sin tira. */
  fondoAlpha?: number;
}

/**
 * La tribuna: los veredictos de los jugadores como marquesina continua.
 * La llaman la pantalla de título (protagonista) y los motores (cánticos de
 * fondo). Sin backend o sin comentarios, no dibuja nada.
 */
export async function tribuna(scene: Phaser.Scene, opciones: TribunaOpciones): Promise<void> {
  const gameId = urlGameId();
  if (!gameId) return;
  try {
    const r = await fetch(`/api/juegos/${encodeURIComponent(gameId)}/resumen`);
    if (!r.ok) return;
    const data = (await r.json()) as ResumenTribuna;
    if (!Array.isArray(data.comentarios) || data.comentarios.length === 0) return;
    if (!scene.scene.isActive()) return;

    const partes = [`🏁 ${data.totalJugadas} ${data.totalJugadas === 1 ? 'partida' : 'partidas'} jugadas`];
    for (const c of data.comentarios.slice(0, 10)) {
      partes.push(`💬 ${c.apodo}: "${c.comentario}"`);
    }
    ticker(scene, partes.join('   ·   '), opciones);
  } catch {
    // sin backend acá: la pantalla queda como siempre
  }
}

// La tira tiene el texto dos veces: al correr un ancho exacto, el loop es seamless.
function ticker(scene: Phaser.Scene, texto: string, opciones: TribunaOpciones): void {
  const width = scene.scale.width;
  const estilo = {
    fontFamily: FONT,
    fontSize: `${opciones.fontSize ?? 15}px`,
    color: opciones.color ?? '#c6cad8',
  };
  if (opciones.fondoAlpha) {
    const alto = (opciones.fontSize ?? 15) + 12;
    scene.add.rectangle(width / 2, opciones.y, width, alto, 0x05050a, opciones.fondoAlpha);
  }
  const mitad = scene.add.text(0, 0, texto, estilo).setOrigin(0, 0.5);
  const tira = scene.add.container(0, opciones.y, [
    mitad,
    scene.add.text(mitad.width, 0, texto, estilo).setOrigin(0, 0.5),
  ]);
  scene.tweens.add({
    targets: tira,
    x: -mitad.width,
    duration: Math.max(14000, mitad.width * 16),
    repeat: -1,
    ease: 'Linear',
  });
}
