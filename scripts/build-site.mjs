// Ensambla el sitio público en dist/ (después de `vite build`): content jugable,
// web/index.html, landings por juego con meta tags OG y tarjetas 1200x630 en PNG
// (los crawlers de WhatsApp no corren JS ni renderizan SVG). Idempotente.
// Uso: node scripts/build-site.mjs  (o `npm run build`, que lo encadena)
//
// Opcionales por entorno:
//   SITE_URL / CF_PAGES_URL        → URL absoluta del sitio (los OG la necesitan)
//   CLOUDFLARE_WEB_ANALYTICS_TOKEN → inyecta el beacon de Cloudflare Web Analytics

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGamespec } from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const eventsDir = join(root, 'content', 'events');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html no existe: corré `vite build` antes de build-site.');
  process.exit(1);
}

const siteUrl = (process.env.SITE_URL || process.env.CF_PAGES_URL || '').replace(/\/+$/, '');
if (!siteUrl) {
  console.warn('⚠ Sin SITE_URL/CF_PAGES_URL: los og:image/og:url quedan relativos (WhatsApp no los va a resolver).');
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Archivos que salen a la web por evento: el gamespec y las imágenes. Los .md
// (produccion.md) y event.json (fuente cruda) quedan afuera.
function publicFiles(dir) {
  return readdirSync(dir).filter(
    (f) => statSync(join(dir, f)).isFile() && (f === 'gamespec.json' || /\.(svg|png|jpe?g|gif|webp)$/i.test(f)),
  );
}

// --- Limpieza de salidas previas de este script (vite build arranca de cero, esto cubre re-ensambres) ---
for (const sub of ['juego', 'og', 'content', 'web', '_redirects']) {
  rmSync(join(dist, sub), { recursive: true, force: true });
}

// --- OG en PNG: avatar rasterizado al centro, fondo de la casa y banda del tema ---
const sharp = (await import('sharp')).default;

async function cardPng(avatarSvgPath, themeBackground) {
  const layers = [];
  if (avatarSvgPath && existsSync(avatarSvgPath)) {
    const avatar = await sharp(avatarSvgPath, { density: 300 }).resize(560, 560, { fit: 'inside' }).png().toBuffer();
    const { width, height } = await sharp(avatar).metadata();
    layers.push({ input: avatar, top: Math.round((630 - height) / 2), left: Math.round((1200 - width) / 2) });
  }
  if (themeBackground && /^#[0-9a-f]{3,8}$/i.test(themeBackground)) {
    const band = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="16"><rect width="1200" height="16" fill="${themeBackground}"/></svg>`,
    );
    layers.push({ input: band, top: 614, left: 0 });
  }
  return sharp({ create: { width: 1200, height: 630, channels: 4, background: '#05050a' } })
    .composite(layers)
    .png()
    .toBuffer();
}

// --- Leer eventos válidos (mismo barrido que build-index) ---
const dirs = readdirSync(eventsDir)
  .filter((name) => statSync(join(eventsDir, name)).isDirectory() && /^[a-z0-9-]+$/i.test(name))
  .sort();

const games = [];
for (const dir of dirs) {
  const file = join(eventsDir, dir, 'gamespec.json');
  if (!existsSync(file)) continue;
  const result = parseGamespec(JSON.parse(readFileSync(file, 'utf8')));
  if (!result.ok) {
    console.error(`✗ ${dir}: gamespec inválido, el sitio no se ensambla:\n${result.error}`);
    process.exit(1);
  }
  games.push({ id: dir, spec: result.data });
}

// --- Tarjeta genérica del sitio (root y juegos sin avatar) ---
const ogDir = join(dist, 'og');
mkdirSync(ogDir, { recursive: true });
writeFileSync(join(ogDir, 'site.png'), await cardPng(null, '#ffd166'));

// --- Landings por juego + content + tarjetas ---
const juegoRoot = join(dist, 'juego');
let copied = 0;

for (const { id, spec } of games) {
  const eventDir = join(eventsDir, id);
  const eventPublicDir = join(dist, 'content', 'events', id);
  mkdirSync(eventPublicDir, { recursive: true });
  for (const f of publicFiles(eventDir)) {
    copyFileSync(join(eventDir, f), join(eventPublicDir, f));
    copied += 1;
  }

  const avatarFile = spec.player.image && publicFiles(eventDir).includes(spec.player.image) ? spec.player.image : null;
  const ogImage = `${siteUrl}/og/${avatarFile ? id : 'site'}.png`;
  if (avatarFile) {
    writeFileSync(join(ogDir, `${id}.png`), await cardPng(join(eventDir, avatarFile), spec.theme?.background));
  }

  const title = escapeHtml(spec.title);
  const intro = escapeHtml(spec.intro.slice(0, 280));
  const landing = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Juego de la Actualidad</title>
    <meta property="og:title" content="${title} — Juego de la Actualidad" />
    <meta property="og:description" content="${intro}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${siteUrl}/juego/${id}/" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${siteUrl}/juego/${id}/" />
    <meta http-equiv="refresh" content="0; url=../../index.html?game=${id}" />
    <style>body { background: #05050a; color: #ffffff; font-family: system-ui, sans-serif; }</style>
  </head>
  <body>
    <!-- La query viaja: /juego/<id>/?revancha=N → index.html?game=<id>&revancha=N (desafío, Etapa 4.3) -->
    <script>location.replace('../../index.html?game=${id}' + location.search.replace(/^\\?/, '&'));</script>
    <p><a style="color: #ffd166" href="../../index.html?game=${id}">Entrar a jugar: ${title}</a></p>
  </body>
</html>
`;
  const landingDir = join(juegoRoot, id);
  mkdirSync(landingDir, { recursive: true });
  writeFileSync(join(landingDir, 'index.html'), landing);
}

// --- Índice de juegos (chooser) ---
const webDist = join(dist, 'web');
mkdirSync(webDist, { recursive: true });
copyFileSync(join(root, 'web', 'index.html'), join(webDist, 'index.html'));

// --- Juegos válidos para el worker (/api rechaza cualquier otro id). Solo con
// fecha, ordenados por fecha: el último es el único "abierto" (recibe partidas).
mkdirSync(join(root, 'worker'), { recursive: true });
const jugables = games
  .filter((g) => /^\d{4}-\d{2}-\d{2}/.test(g.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((g) => ({ id: g.id, fecha: g.id.slice(0, 10) }));
writeFileSync(join(root, 'worker', 'juegos.json'), `${JSON.stringify(jugables, null, 2)}\n`);

// --- Sin `_redirects`: los Workers normalizan /index.html → / (307), así que una
// regla `/ → /web/` convertía TODOS los deep links en el chooser. El chooser se
// elige desde la app: sin ?game=, main.ts redirige a /web/.

// --- 404 amable (not_found_handling: "404-page" en wrangler.jsonc) ---
writeFileSync(
  join(dist, '404.html'),
  `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 — Juego de la Actualidad</title>
    <style>
      body { background: #05050a; color: #ffffff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      div { text-align: center; }
      h1 { letter-spacing: 3px; }
      a { color: #ffd166; }
    </style>
  </head>
  <body>
    <div>
      <h1>404: ACÁ NO HAY NADA</h1>
      <p>Este juego no existe (o todavía no).</p>
      <p><a href="/">← Elegir otro juego</a></p>
    </div>
  </body>
</html>
`,
);

// --- OG por defecto + beacon en la app y el chooser ---
const beaconToken = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN;
const beacon = beaconToken
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${beaconToken}"}'></script>`
  : '';

const rootOg = `    <meta property="og:title" content="Juego de la Actualidad" />
    <meta property="og:description" content="La noticia del día, jugable. Elegí un juego, jugá y mirá qué pasó de verdad." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:image" content="${siteUrl}/og/site.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
`;

const appHtml = readFileSync(join(dist, 'index.html'), 'utf8');
writeFileSync(
  join(dist, 'index.html'),
  appHtml.replace('</head>', `${rootOg}</head>`).replace('</body>', `${beacon}</body>`),
);
const webHtml = readFileSync(join(webDist, 'index.html'), 'utf8');
writeFileSync(
  join(webDist, 'index.html'),
  webHtml.replace('</head>', `${rootOg}</head>`).replace('</body>', `${beacon}</body>`),
);

console.log(
  `Sitio ensamblado en dist/: ${games.length} landings OG, ${copied} archivos de contenido` +
    (beaconToken ? ', beacon de analytics' : '') +
    (siteUrl ? `, SITE_URL=${siteUrl}` : ', sin SITE_URL (OG relativo)'),
);
