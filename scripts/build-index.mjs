// Portada del día: genera web/index.html a partir de content/events/.
// Arriba, el juego (o los juegos) de la fecha más nueva en grande; debajo, un
// carrusel chico con los juegos de los últimos 7 días. Los demos (sin fecha)
// no salen en la portada: se juegan por deep link. Nunca toca los juegos.
// Criterio de orden: recencia. "Populares" queda definido como más partidas
// registradas en 7 días para cuando el backend de comentarios/ranking acumule
// datos (decisión 2026-10-12 en PROJECT.md).
// Uso: node scripts/build-index.mjs

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGamespec } from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const eventsDir = join(root, 'content', 'events');
const webDir = join(root, 'web');
const DIAS_CARRUSEL = 7;

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function eventDate(dir) {
  const file = join(eventsDir, dir, 'event.json');
  if (existsSync(file)) {
    try {
      const date = JSON.parse(readFileSync(file, 'utf8')).date;
      if (typeof date === 'string' && date) return date;
    } catch {
      // event.json roto: no bloquea la web, cae al prefijo del id
    }
  }
  return /^(\d{4}-\d{2}-\d{2})/.exec(dir)?.[1] ?? '';
}

const dirs = readdirSync(eventsDir).filter((name) => statSync(join(eventsDir, name)).isDirectory());

const juegos = [];
const failures = [];
let excluidos = 0;

for (const dir of dirs) {
  const file = join(eventsDir, dir, 'gamespec.json');
  if (!existsSync(file)) {
    failures.push(`${dir}: falta gamespec.json`);
    continue;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${dir}: JSON inválido (${error.message})`);
    continue;
  }
  const result = parseGamespec(json);
  if (!result.ok) {
    failures.push(`${dir}\n${result.error}`);
    continue;
  }
  const date = eventDate(dir);
  if (!date) {
    excluidos += 1; // demo sin fecha: no sale en la portada
    continue;
  }
  juegos.push({ id: dir, spec: result.data, date });
}

juegos.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)));

if (failures.length > 0) {
  console.error(`${failures.length} gamespec(s) inválido(s), la web no se genera:\n`);
  for (const failure of failures) console.error(`✗ ${failure}\n`);
  process.exit(1);
}

if (juegos.length === 0) {
  console.error('No hay juegos con fecha: la portada no se genera.');
  process.exit(1);
}

const fechaHero = juegos[0].date;
const heroes = juegos.filter((j) => j.date === fechaHero);
const fechasCarrusel = [...new Set(juegos.filter((j) => j.date < fechaHero).map((j) => j.date))].slice(0, DIAS_CARRUSEL);
const carrusel = juegos.filter((j) => fechasCarrusel.includes(j.date));

function avatarHtml(juego) {
  const { id, spec } = juego;
  return spec.player.image
    ? `<img src="../content/events/${id}/${encodeURIComponent(spec.player.image)}" alt="${escapeHtml(spec.player.label)}" />`
    : `<span class="emoji">${spec.player.emoji}</span>`;
}

const metaHtml = (juego) =>
  `<div class="meta"><span class="badge">${escapeHtml(juego.spec.game)}</span><span>⏱ ${juego.spec.duration}s</span><span>📅 ${escapeHtml(juego.date)}</span></div>`;

const heroCards = heroes
  .map((juego) => {
    const accent = juego.spec.theme?.background ? ` style="border-left-color: ${escapeHtml(juego.spec.theme.background)}"` : '';
    return `
      <a class="hero-card"${accent} href="../index.html?game=${encodeURIComponent(juego.id)}">
        <div class="hero-avatar">${avatarHtml(juego)}</div>
        <div class="hero-body">
          ${metaHtml(juego)}
          <h2>${escapeHtml(juego.spec.title)}</h2>
          <p class="hero-intro">${escapeHtml(juego.spec.intro)}</p>
          <span class="hero-cta">▶ JUGAR</span>
        </div>
      </a>`;
  })
  .join('\n');

const minis = carrusel
  .map((juego) => {
    const accent = juego.spec.theme?.background ? ` style="border-top-color: ${escapeHtml(juego.spec.theme.background)}"` : '';
    return `
        <a class="mini"${accent} href="../index.html?game=${encodeURIComponent(juego.id)}">
          <div class="mini-avatar">${avatarHtml(juego)}</div>
          <h2>${escapeHtml(juego.spec.title)}</h2>
          ${metaHtml(juego)}
        </a>`;
  })
  .join('\n');

const ahora = new Date();
const pad = (n) => String(n).padStart(2, '0');
const hoy = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
const stamp = `${hoy} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
const etiquetaHero = fechaHero === hoy ? 'EL JUEGO DE HOY' : `ÚLTIMO JUEGO — ${fechaHero}`;

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Juego de la Actualidad</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px 24px 48px;
        background: #05050a;
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
      }
      header { max-width: 1100px; margin: 0 auto 24px; }
      h1 {
        margin: 0 0 6px;
        font-size: 34px;
        letter-spacing: 3px;
        text-transform: uppercase;
      }
      header p { margin: 0; color: #9aa0b5; }
      .seccion {
        max-width: 1100px;
        margin: 0 auto 12px;
        color: #ffd166;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 3px;
      }
      .hero-grid {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 20px;
      }
      .hero-card {
        display: flex;
        gap: 26px;
        background: #101018;
        border: 1px solid #262636;
        border-left: 6px solid #ffd166;
        border-radius: 14px;
        padding: 26px;
        color: inherit;
        text-decoration: none;
      }
      .hero-card:hover { border-color: #ffd166; }
      .hero-avatar { flex: 0 0 150px; display: flex; align-items: center; }
      .hero-avatar img { width: 150px; height: auto; }
      .hero-avatar .emoji { font-size: 100px; line-height: 1; }
      .hero-body { min-width: 0; }
      .hero-body .meta { margin-bottom: 10px; }
      .hero-card h2 { margin: 0 0 10px; font-size: 30px; letter-spacing: 2px; }
      .hero-intro {
        margin: 0 0 18px;
        color: #c6cad8;
        font-size: 15px;
        line-height: 1.5;
      }
      .hero-cta {
        display: inline-block;
        background: #ffd166;
        color: #05050a;
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 2px;
        padding: 10px 28px;
        border-radius: 8px;
      }
      .carrusel {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        gap: 16px;
        overflow-x: auto;
        padding-bottom: 12px;
        scroll-snap-type: x mandatory;
      }
      .mini {
        flex: 0 0 250px;
        scroll-snap-align: start;
        background: #101018;
        border: 1px solid #262636;
        border-top: 4px solid #ffd166;
        border-radius: 12px;
        padding: 18px;
        color: inherit;
        text-decoration: none;
      }
      .mini:hover { border-color: #ffd166; }
      .mini-avatar { height: 48px; display: flex; align-items: center; margin-bottom: 10px; }
      .mini-avatar img { height: 48px; }
      .mini-avatar .emoji { font-size: 38px; line-height: 1; }
      .mini h2 {
        margin: 0 0 8px;
        font-size: 15px;
        letter-spacing: 1px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .meta {
        display: flex;
        gap: 12px;
        align-items: center;
        color: #9aa0b5;
        font-size: 13px;
        white-space: nowrap;
      }
      .badge {
        background: #262636;
        color: #ffd166;
        padding: 2px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 1px;
      }
      footer {
        max-width: 1100px;
        margin: 28px auto 0;
        color: #6b7085;
        font-size: 13px;
      }
      @media (max-width: 640px) {
        .hero-card { flex-direction: column; }
        .hero-avatar { flex-basis: auto; }
        .hero-avatar img { width: 110px; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Juego de la Actualidad</h1>
      <p>La noticia del día, jugable. Jugá el de hoy y mirá qué pasó de verdad.</p>
    </header>
    <p class="seccion">${etiquetaHero}</p>
    <main class="hero-grid">${heroCards}
    </main>${
      carrusel.length > 0
        ? `
    <p class="seccion" style="margin-top: 36px">LOS ANTERIORES</p>
    <section class="carrusel">${minis}
    </section>`
        : ''
    }
    <footer>La noticia del día, jugable — ${juegos.length} juegos. Generado el ${stamp}.</footer>
  </body>
</html>
`;

mkdirSync(webDir, { recursive: true });
writeFileSync(join(webDir, 'index.html'), html);
console.log(
  `Portada generada: web/index.html — hero ${fechaHero} (${heroes.length}), carrusel ${carrusel.length} de ${fechasCarrusel.length} días` +
    (excluidos ? `, ${excluidos} demo(s) fuera de la portada` : ''),
);
