// Radar diario: fetch de feeds RSS argentinos → candidatos crudos con fuentes.
// Salida: content/radar/<fecha>/candidatos.md. Nunca genera ni modifica juegos.
// Uso: node scripts/radar.mjs [YYYY-MM-DD]

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Feeds verificados el 2026-10-08. Si uno se rompe, el radar sigue con el resto.
const FEEDS = [
  { outlet: 'Clarín', url: 'https://www.clarin.com/rss/' },
  { outlet: 'La Nación', url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml' },
  { outlet: 'Infobae', url: 'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml' },
  { outlet: 'Ámbito', url: 'https://www.ambito.com/rss/home.xml' },
  { outlet: 'Perfil', url: 'https://www.perfil.com/feed' },
];

const MAX_PER_FEED = 20;
const TIMEOUT_MS = 15000;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', iexcl: '¡', iquest: '¿',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…', mdash: '—', ndash: '–',
};

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (raw, name) => ENTITIES[name] ?? raw);
}

function tagText(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return decodeEntities(match[1].replaceAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim();
}

function shortDate(rfc822) {
  const date = new Date(rfc822);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) radar-myfirstproject/0.1',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  const items = [];
  for (const raw of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []) {
    const title = tagText(raw, 'title');
    const link = tagText(raw, 'link');
    if (!title || !link) continue;
    items.push({ title, link, when: shortDate(tagText(raw, 'pubDate')) });
    if (items.length >= MAX_PER_FEED) break;
  }
  return items;
}

function today() {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const fecha = process.argv[2] ?? today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
  console.error(`Fecha inválida: "${fecha}" (esperado YYYY-MM-DD)`);
  process.exit(1);
}

console.log(`Radar ${fecha}: bajando ${FEEDS.length} feeds...`);

const results = await Promise.allSettled(FEEDS.map(fetchFeed));
const sections = [];
const seen = new Set();
let ok = 0;

for (let i = 0; i < FEEDS.length; i++) {
  const feed = FEEDS[i];
  const result = results[i];
  if (result.status === 'fulfilled' && result.value.length > 0) {
    ok++;
    const fresh = result.value.filter((item) => {
      const key = item.link.replace(/[?#].*$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const lines = fresh.map((item, n) => {
      const when = item.when ? ` — ${item.when}` : '';
      return `${n + 1}. [${item.title}](<${item.link}>)${when}`;
    });
    sections.push(`## ${feed.outlet} (${fresh.length} noticias)\n\n${lines.join('\n')}`);
    console.log(`OK  ${feed.outlet}: ${fresh.length} items`);
  } else {
    const reason = result.status === 'rejected' ? result.reason?.message : 'sin items';
    sections.push(`## ${feed.outlet} (sin datos)\n\n> Falló: ${reason}`);
    console.error(`✗   ${feed.outlet}: ${reason}`);
  }
}

if (ok === 0) {
  console.error('\nNingún feed respondió: no se escribe candidatos.md.');
  process.exit(1);
}

const header = [
  `# Radar — ${fecha}`,
  '',
  `Candidatos crudos generados por \`scripts/radar.mjs\` (${ok}/${FEEDS.length} feeds OK,`,
  `${seen.size} noticias). Entrada del paso 2 del runbook: \`content/prompts/radar-diario.md\`.`,
  '',
];

const outDir = join(root, 'content', 'radar', fecha);
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'candidatos.md');
writeFileSync(outFile, `${header.join('\n')}\n${sections.join('\n\n')}\n`);
console.log(`\nEscrito: content/radar/${fecha}/candidatos.md (${seen.size} noticias, ${ok}/${FEEDS.length} feeds)`);
