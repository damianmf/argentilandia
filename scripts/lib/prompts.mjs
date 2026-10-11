// Utilidades compartidas de los pasos LLM del pipeline: carga de los prompt .md
// (fuente única, en content/prompts/), extracción de secciones por encabezado y
// fetch del texto de una noticia para extraer hechos.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const promptsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'prompts');

export function loadPrompt(name) {
  return readFileSync(join(promptsDir, name), 'utf8');
}

// Devuelve el contenido de la sección "## <encabezado>" (hasta el próximo
// encabezado del mismo nivel o el fin del archivo).
export function extractSection(markdown, encabezado) {
  const pattern = new RegExp(`^##+ ${encabezado}\\s*$`, 'm');
  const match = markdown.match(pattern);
  if (!match) return null;
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.match(/^##+ /m);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

// Baja la noticia del ganador y la reduce a texto plano para el prompt.
// Devuelve { texto, ok }. Sin bloqueo: si el outlet rechaza bots, ok=false y el
// pipeline sigue con los titulares (regla del plan: fallback a resúmenes).
export async function fetchArticle(url, { maxChars = 8000, timeoutMs = 15_000 } = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        Accept: 'text/html,*/*',
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });
    if (!response.ok) return { texto: '', ok: false, motivo: `HTTP ${response.status}` };
    const html = await response.text();
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxChars);
    if (texto.length < 400) return { texto: '', ok: false, motivo: 'texto demasiado corto (¿paywall?)' };
    return { texto, ok: true, motivo: '' };
  } catch (error) {
    return { texto: '', ok: false, motivo: error.message };
  }
}

// Normaliza texto para comparar hechos (minúsculas, sin acentos ni puntuación).
export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Fracción de palabras de `fact` que aparecen en el corpus de hechos del Event.
// Sirve para marcar facts del outro que parecen ir más allá de lo informado.
export function solapamiento(fact, factsEvent) {
  const palabras = normalizar(fact).split(' ').filter((p) => p.length > 3);
  if (palabras.length === 0) return 1;
  const corpus = new Set(normalizar(factsEvent.join(' ')).split(' '));
  const dentro = palabras.filter((p) => corpus.has(p)).length;
  return dentro / palabras.length;
}
