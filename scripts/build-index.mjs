// Web diaria: genera web/index.html a partir de content/events/. Nunca toca los juegos.
// Cards con avatar/emoji, duración y fecha; cada una enlaza a ?game=<id>.
// Uso: node scripts/build-index.mjs

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGamespec } from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const eventsDir = join(root, 'content', 'events');
const webDir = join(root, 'web');

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

const dirs = readdirSync(eventsDir)
  .filter((name) => statSync(join(eventsDir, name)).isDirectory())
  .sort()
  .reverse();

const cards = [];
const failures = [];

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
  const spec = result.data;
  const avatar = spec.player.image
    ? `<img src="../content/events/${dir}/${encodeURIComponent(spec.player.image)}" alt="${escapeHtml(spec.player.label)}" />`
    : `<span class="emoji">${spec.player.emoji}</span>`;
  const accent = spec.theme?.background ? ` style="border-top-color: ${escapeHtml(spec.theme.background)}"` : '';
  const date = eventDate(dir);
  cards.push(`
      <a class="card"${accent} href="../index.html?game=${encodeURIComponent(dir)}">
        <div class="avatar">${avatar}</div>
        <h2>${escapeHtml(spec.title)}</h2>
        <p class="intro">${escapeHtml(spec.intro)}</p>
        <div class="meta">
          <span class="badge">${escapeHtml(spec.game)}</span>
          <span>⏱ ${spec.duration}s</span>
          <span>📅 ${date ? escapeHtml(date) : 's/fecha'}</span>
        </div>
      </a>`);
}

if (failures.length > 0) {
  console.error(`${failures.length} gamespec(s) inválido(s), la web no se genera:\n`);
  for (const failure of failures) console.error(`✗ ${failure}\n`);
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

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
      header { max-width: 1100px; margin: 0 auto 28px; }
      h1 {
        margin: 0 0 6px;
        font-size: 34px;
        letter-spacing: 3px;
        text-transform: uppercase;
      }
      header p { margin: 0; color: #9aa0b5; }
      .grid {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      .card {
        display: block;
        background: #101018;
        border: 1px solid #262636;
        border-top: 4px solid #ffd166;
        border-radius: 12px;
        padding: 22px;
        color: inherit;
        text-decoration: none;
      }
      .card:hover { border-color: #ffd166; }
      .avatar { height: 64px; display: flex; align-items: center; margin-bottom: 12px; }
      .avatar img { height: 64px; }
      .avatar .emoji { font-size: 48px; line-height: 1; }
      .card h2 { margin: 0 0 8px; font-size: 21px; letter-spacing: 1px; }
      .intro {
        margin: 0 0 14px;
        color: #c6cad8;
        font-size: 14px;
        line-height: 1.45;
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
    </style>
  </head>
  <body>
    <header>
      <h1>Juego de la Actualidad</h1>
      <p>La noticia del día, jugable. Elegí un juego, jugá y mirá qué pasó de verdad.</p>
    </header>
    <main class="grid">${cards.join('')}
    </main>
    <footer>La noticia del día, jugable — ${cards.length} juegos. Generado el ${stamp}.</footer>
  </body>
</html>
`;

mkdirSync(webDir, { recursive: true });
writeFileSync(join(webDir, 'index.html'), html);
console.log(`Web diaria generada: web/index.html (${cards.length} juegos)`);
