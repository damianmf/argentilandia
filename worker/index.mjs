// Worker del sitio: assets estáticos (todo lo que no es /api/*) + API de
// comentarios y ranking sobre D1. Los game_ids válidos vienen de
// worker/juegos.json, que regenera `npm run build` en cada deploy.
//
// Este archivo solo corre cuando wrangler.jsonc tiene `main` y el binding D1:
// los cuelga `npm run backend:setup` (requiere wrangler login). Hasta ahí el
// sitio sigue siendo assets-only y este código queda dormido en el repo.
//
// Endpoints (mismo origen, sin CORS):
//   POST /api/juegos/<id>/partidas  { apodo, score, comentario? } → { ok, puesto, totalJugadores }
//   GET  /api/juegos/<id>/resumen   → { ranking, comentarios, totalJugadas, totalJugadores }
//
// Moderación: publicar es inmediato; lo que se esconde es posterior, desde la
// auditoría diaria (`UPDATE partidas SET visible = 0 WHERE id = …` vía
// `npx wrangler d1 execute`). Rate limit: 6 envíos por IP y juego por hora.

import JUEGOS from './juegos.json';

const APODO_MAX = 24;
const COMENTARIO_MAX = 200;
const SCORE_MAX = 100000;
const RATE_POR_HORA = 6;
const HORA_MS = 60 * 60 * 1000;

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function error(status, mensaje) {
  return json({ error: mensaje }, status);
}

function limpiar(texto, max) {
  return String(texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function sha256(texto) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function juegoValido(id) {
  return typeof id === 'string' && /^[a-z0-9-]{1,80}$/i.test(id) && JUEGOS.some((j) => j.id === id);
}

// Solo el juego más nuevo publicado recibe partidas (JUEGOS viene ordenado por
// fecha); los anteriores son archivo congelado: se pueden leer, no escribir.
function juegoAbierto(id) {
  return JUEGOS.length > 0 && JUEGOS[JUEGOS.length - 1].id === id;
}

// Clasificación: mejor puntaje por apodo, con total de jugadores y en qué
// puesto queda un score dado (1 = mejor).
const agrupado = 'SELECT apodo, MAX(score) AS score FROM partidas WHERE game_id = ?1 AND visible = 1 GROUP BY apodo';

async function presentar(request, env, id) {
  if (!env.DB) return error(503, 'backend sin configurar (falta el binding D1)');
  if (!juegoValido(id)) return error(404, 'ese juego no existe');

  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname.endsWith('/resumen')) {
    const [ranking, comentarios, totales] = await Promise.all([
      env.DB.prepare(`${agrupado} ORDER BY score DESC, apodo ASC LIMIT 10`).bind(id).all(),
      env.DB
        .prepare('SELECT apodo, comentario, creado_at FROM partidas WHERE game_id = ?1 AND visible = 1 AND comentario IS NOT NULL ORDER BY id DESC LIMIT 20')
        .bind(id)
        .all(),
      env.DB.prepare('SELECT COUNT(*) AS jugadas, COUNT(DISTINCT apodo) AS jugadores FROM partidas WHERE game_id = ?1 AND visible = 1').bind(id).first(),
    ]);
    return json({
      ranking: ranking.results ?? [],
      comentarios: (comentarios.results ?? []).map((c) => ({ apodo: c.apodo, comentario: c.comentario, fecha: new Date(c.creado_at).toISOString() })),
      totalJugadas: totales?.jugadas ?? 0,
      totalJugadores: totales?.jugadores ?? 0,
      abierto: juegoAbierto(id),
    });
  }

  if (request.method === 'POST' && url.pathname.endsWith('/partidas')) {
    if (!juegoAbierto(id)) {
      return error(403, 'este ranking ya cerró: solo el juego del día recibe partidas; el escalafón de este queda congelado');
    }
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return error(400, 'body JSON inválido');
    }
    const apodo = limpiar(cuerpo.apodo, APODO_MAX) || 'ANÓNIMO';
    const comentario = limpiar(cuerpo.comentario, COMENTARIO_MAX) || null;
    const score = cuerpo.score;
    if (!Number.isInteger(score) || score < -SCORE_MAX || score > SCORE_MAX) {
      return error(400, `score tiene que ser un entero entre ±${SCORE_MAX} (el fighter puede terminar en negativo)`);
    }

    const ip = request.headers.get('cf-connecting-ip') ?? 'desconocida';
    const ipHash = await sha256(`${ip}:${env.IP_SALT ?? 'jornada'}`);
    const ahora = Date.now();

    const recientes = await env.DB
      .prepare('SELECT COUNT(*) AS n FROM partidas WHERE ip_hash = ?1 AND game_id = ?2 AND creado_at > ?3')
      .bind(ipHash, id, ahora - HORA_MS)
      .first();
    if ((recientes?.n ?? 0) >= RATE_POR_HORA) {
      return error(429, 'muchas partidas seguidas: probá de nuevo más tarde');
    }

    await env.DB.prepare('INSERT INTO partidas (game_id, apodo, score, comentario, ip_hash, visible, creado_at) VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6)').bind(id, apodo, score, comentario, ipHash, ahora).run();

    const puesto = await env.DB
      .prepare(`SELECT COUNT(*) AS mejores, (SELECT COUNT(*) FROM (${agrupado})) AS total FROM (${agrupado}) WHERE score > ?2`)
      .bind(id, score)
      .first();
    return json({ ok: true, puesto: (puesto?.mejores ?? 0) + 1, totalJugadores: puesto?.total ?? 1 });
  }

  return error(404, 'endpoint desconocido');
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const match = /^\/api\/juegos\/([^/]+)\/(partidas|resumen)$/.exec(pathname);
    if (match) {
      try {
        return await presentar(request, env, decodeURIComponent(match[1]));
      } catch {
        return error(500, 'error interno del ranking');
      }
    }
    return env.ASSETS.fetch(request);
  },
};
