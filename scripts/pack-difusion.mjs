// Pack de difusión diario: convierte el juego del día en material listo para
// pegar (WhatsApp, X, y un comentario por cada outlet fuente de la nota).
//
// Determinista a propósito: nada de LLM ni de posteo automático. Lo que sale
// de acá lo copia y pega el humano, siempre firmando que el juego es propio.
// Las reglas de oro del final no son decoración: un outlet que borra el
// comentario queda quemado una semana — mejor quemar el outlet que la cuenta.
//
// Uso: node scripts/pack-difusion.mjs [fecha|idEvento]
// Escribe content/events/<id>/difusion.md (jornada.mjs lo commitea con el día).

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function hoy() {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const arg = process.argv[2] ?? hoy();
const eventsDir = join(root, 'content', 'events');
const idEvento = existsSync(join(eventsDir, arg))
  ? arg
  : readdirSync(eventsDir).find((name) => name.startsWith(`${arg}-`));
if (!idEvento) {
  console.error(`Sin evento para '${arg}' en content/events/ (¿día sin juego?)`);
  process.exit(1);
}

const event = JSON.parse(readFileSync(join(eventsDir, idEvento, 'event.json'), 'utf8'));
const spec = JSON.parse(readFileSync(join(eventsDir, idEvento, 'gamespec.json'), 'utf8'));

const base = (process.env.SITE_URL || 'https://argentilandia.actualidad.workers.dev').replace(/\/+$/, '');
const link = `${base}/juego/${idEvento}/`;
const titulo = spec.title;
const emoji = spec.emoji?.split(' ')[0] ?? '🎮';
// El pitch (intro) es el mejor texto de venta: primera oración para gancho.
const gancho = primeraOracion(spec.intro) || spec.ranking?.titulo || '';
const hecho = primeraOracion(event.facts?.[0] ?? '');
const duracion = spec.game === 'decide' ? '1 minutito' : `${spec.duration ?? 30} s`;

// Corta por palabra (no a mitad de una) y limpia puntuación colgante.
function cortar(texto, max) {
  if (texto.length <= max) return texto;
  const c = texto.slice(0, max - 1);
  const p = c.lastIndexOf(' ');
  return `${(p > max * 0.6 ? c.slice(0, p) : c).replace(/[\s,;:—-]+$/, '')}…`;
}

function primeraOracion(texto) {
  const t = (texto ?? '').trim();
  if (!t) return '';
  const primera = t.split(/(?<=[.!?])\s/)[0] ?? t;
  return cortar(primera, 150);
}

const whatsapp = [
  `Salió el juego del día 🇦🇷`,
  `${emoji} ${titulo} — ${cortar(gancho, 90)}`,
  `Jugalo acá (${duracion}, gratis, sin registro): ${link}`,
  `⚔️ ¿Me ganás? Tu puntaje viaja en el link`,
].join('\n');

const postX = cortar(`${emoji} ${titulo}: ${gancho} ${link}`, 280);

// Un comentario por OUTLET (regla de oro), aunque la nota tenga varias fuentes
// del mismo medio: la primera es la principal, el resto queda como alternativa.
const porOutlet = new Map();
for (const s of event.sources ?? []) {
  if (!porOutlet.has(s.outlet)) porOutlet.set(s.outlet, []);
  porOutlet.get(s.outlet).push(s);
}
const comentarios = [...porOutlet.entries()].map(([outlet, notas]) => ({
  outlet,
  notas,
  texto: cortar(
    `Esta nota la convertimos en un jueguito satírico: ${titulo}. ` +
      (hecho ? `Arranca de acá: ${hecho} ` : '') +
      `Se juega en ${duracion}, gratis y sin registro: ${link}`,
    600,
  ),
}));

const seccion = (c) => [
  `### ${c.outlet} — comentar en una de sus notas (una sola)`,
  `> Principal: ${c.notas[0].title}`,
  `> ${c.notas[0].url}`,
  ...(c.notas.length > 1
    ? [`>`, `> Alternativas (misma regla: una sola, en una sola):`]
    : []),
  ...c.notas.slice(1).map((n) => `> - ${n.url}`),
  '',
  '```text',
  c.texto,
  '```',
  '',
].join('\n');

const md = `# Pack de difusión — ${titulo}

Fecha: ${event.date} · Motor: \`${spec.game}\` · Link: ${link}

Todo lo de acá se copia y pega a mano. Nada se postea solo.

## WhatsApp (grupos / contactos)

\`\`\`text
${whatsapp}
\`\`\`

## X / Threads (1 post)

\`\`\`text
${postX}
\`\`\`

## Comentarios en las notas fuente

${comentarios.map(seccion).join('\n') || '_(sin fuentes: el evento no tiene sources)_'}
${
  comentarios.length > 1
    ? `\nHay ${comentarios.length} outlets: si el día no da, elegí uno y guardá el resto para mañana (el juego sigue online).`
    : ''
}

## Reglas de oro (las hace cumplir el humano, no el script)

1. **Un comentario por outlet, y solo en la nota del día.** Nunca en varias notas del mismo medio ni en notas viejas: eso es spam y quema el dominio.
2. **Siempre declará que el juego es propio.** Cero cuentas disfrazadas de lector sorprendido: es lo ético y además es lo que evita el ban.
3. **El comentario aporta algo** (un dato real del juego, un hecho de la nota), no es solo el link.
4. **Si borran el comentario o lo marcan spam: ese outlet queda quemado 7 días.** Anotalo acá abajo y no insistas.
5. **Tope del día: 10 minutos.** Si no da, WhatsApp + X y listo; los comentarios son el canal de crecimiento, no el único.

## Registro de posteo (completar a mano)

| Canal | Posteado | Reacción / moderación |
|---|---|---|
| WhatsApp | ☐ | |
| X / Threads | ☐ | |
${comentarios.map((c) => `| ${c.outlet} | ☐ | |`).join('\n')}
`;

const salida = join(eventsDir, idEvento, 'difusion.md');
writeFileSync(salida, md);
console.log(`Pack de difusión escrito: ${salida.replace(`${root}/`, '')} (${comentarios.length} outlets)`);
