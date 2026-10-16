// Paso draft headless (Etapa 2): reemplaza el draft que hacía el agente en sesión.
// Llamada A: preselección de titulares con scores de los 6 criterios + descartes.
// Llamada B: del ganador, Event completo + 3 pitches con autopuntaje.
// Salida: content/radar/<fecha>/seleccion.json (registro comparable, plan-poc3
// Etapa 2.2) + draft.md renderizado desde ese JSON (auditable).
// Uso: node scripts/generar-draft.mjs [YYYY-MM-DD]

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatJSON } from './lib/llm.mjs';
import { extractSection, fetchArticle, loadPrompt } from './lib/prompts.mjs';
import { eventSchema } from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOTORES = ['catcher', 'dodge', 'search', 'runner', 'fighter', 'whack'];
const CRITERIOS = ['actualidad', 'jugabilidad', 'humor', 'reconocibilidad', 'shareability', 'explicabilidad'];

function hoy() {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const fecha = process.argv[2] ?? hoy();
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
  console.error(`Fecha inválida: "${fecha}" (esperado YYYY-MM-DD)`);
  process.exit(1);
}

const radarDir = join(root, 'content', 'radar', fecha);
const candidatosPath = join(radarDir, 'candidatos.md');
if (!existsSync(candidatosPath)) {
  console.error(`No existe ${candidatosPath}. Corré primero: npm run radar -- ${fecha}`);
  process.exit(1);
}

// Variedad: qué motor y categoría usaron los últimos 7 días (regla Etapa 2.2:
// no repetir motor ni categoría dos días seguidos).
function eventosRecientes() {
  const eventsDir = join(root, 'content', 'events');
  if (!existsSync(eventsDir)) return [];
  return readdirSync(eventsDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}-/.test(name) && name.startsWith(fecha) === false)
    .sort()
    .slice(-7)
    .map((name) => {
      try {
        const event = JSON.parse(readFileSync(join(eventsDir, name, 'event.json'), 'utf8'));
        const spec = JSON.parse(readFileSync(join(eventsDir, name, 'gamespec.json'), 'utf8'));
        return { id: name, fecha: event.date, categoria: event.category, motor: spec.game, titulo: spec.title, evento: event.event };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const recientes = eventosRecientes();
const ultima = recientes.at(-1) ?? null;
const categoriaProhibida = ultima?.categoria ?? null;
const motorProhibido = ultima?.motor ?? null;

// Memoria del draft (días anteriores): qué se jugó, qué quedó en la mesa y qué
// se descartó. Un descarte de ayer puede ganar hoy; una historia que sigue es
// candidata a segunda jornada (con giro nuevo, no el mismo chiste).
function seleccionAnteriores() {
  const radarDir = join(root, 'content', 'radar');
  if (!existsSync(radarDir)) return [];
  return readdirSync(radarDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name) && name < fecha)
    .sort()
    .slice(-2)
    .map((dia) => {
      try {
        return { dia, seleccion: JSON.parse(readFileSync(join(radarDir, dia, 'seleccion.json'), 'utf8')) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const anteriores = seleccionAnteriores();
const urlsAnteriores = new Set(
  anteriores.flatMap(({ seleccion: s }) =>
    [...(s.preseleccion ?? []), ...(s.descartes ?? [])].map((p) => p?.url).filter(Boolean),
  ),
);

// Veredictos de los jugadores del último juego (backend de comentarios). Si no
// hay backend, no hay comentarios o falla la red, el draft sigue sin ellos.
async function veredictosJugadores(ultimoId) {
  if (!ultimoId) return null;
  const base = (process.env.SITE_URL || 'https://argentilandia.dami-fontenla.workers.dev').replace(/\/+$/, '');
  try {
    const respuesta = await fetch(`${base}/api/juegos/${encodeURIComponent(ultimoId)}/resumen`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!respuesta.ok) return null;
    const data = await respuesta.json();
    return Array.isArray(data.comentarios) && data.comentarios.length > 0 ? data.comentarios.slice(0, 20) : null;
  } catch {
    return null;
  }
}

const memoriaTexto = anteriores.length
  ? `Memoria de jornadas anteriores (para no repetir chistes y para segundas partes):
${anteriores
  .map(({ dia, seleccion: s }) => {
    const jugado = s.event ? `${s.event.event}${s.event.category ? ` [categoría ${s.event.category}]` : ''}` : 'día sin juego';
    const preseleccion =
      (s.preseleccion ?? []).map((p) => `${p.titular} (${CRITERIOS.map((c) => `${c} ${p.scores?.[c] ?? '?'}`).join(', ')})`).join('; ') || '—';
    const descartes = (s.descartes ?? []).map((d) => `${d.titular} — ${d.razon}`).join('; ') || '—';
    return `- ${dia}: JUGADO: ${jugado}\n  PRESELECCIONADOS: ${preseleccion}\n  DESCARTES: ${descartes}`;
  })
  .join('\n')}

Reglas de memoria:
- Un descarte o preseleccionado de un día anterior que REAPARECE hoy puede ganar hoy: si la noticia creció, puede pasar el umbral que ayer no pasó. Si pasa, decilo en el motivo ("reincidente: ...").
- Si el ganador de hoy es la misma historia de un juego ya publicado, el juego nuevo tiene que ser un GIRO (qué cambió HOY), no el mismo chiste otra vez.`
  : 'Sin jornadas anteriores en la memoria: sin reglas de memoria.';

const veredictos = await veredictosJugadores(recientes.at(-1)?.id ?? null);
const veredictosTexto = veredictos
  ? `Veredictos de los jugadores del último juego (backend de comentarios):
${veredictos.map((c) => `- ${c.apodo}: "${c.comentario}"`).join('\n')}
Tomalo como señal editorial: si la gente pidió más acidez, otra mecánica u otra historia, ponderalo al puntuar.`
  : '';

const lineaEditorial = loadPrompt('linea-editorial.md');
const criterios = extractSection(loadPrompt('event-analysis.md'), 'Instrucciones');
const promptRadar = loadPrompt('radar-diario.md');
const contratoA = extractSection(promptRadar, 'Llamada A — preselección');
const contratoB = extractSection(promptRadar, 'Llamada B — evento y pitches');

// --- Llamada A: preselección ---------------------------------------------

function validarA(json) {
  if (!Array.isArray(json.preseleccion) || json.preseleccion.length === 0 || json.preseleccion.length > 5) {
    return 'preseleccion: tiene que ser un array de 1 a 5 candidatos';
  }
  for (const [i, item] of json.preseleccion.entries()) {
    if (typeof item.titular !== 'string' || typeof item.url !== 'string') return `preseleccion[${i}]: faltan titular/url`;
    for (const criterio of CRITERIOS) {
      const v = item.scores?.[criterio];
      if (!Number.isInteger(v) || v < 1 || v > 10) return `preseleccion[${i}].scores.${criterio}: entero 1-10`;
    }
    if (typeof item.motivo !== 'string' || item.motivo.length === 0) return `preseleccion[${i}].motivo: falta`;
  }
  if (!Array.isArray(json.descartes) || json.descartes.length === 0) {
    return 'descartes: obligatorio, con lo que no preseleccionaste y por qué (mínimo 1)';
  }
  for (const [i, d] of json.descartes.entries()) {
    if (typeof d.titular !== 'string' || typeof d.url !== 'string' || typeof d.razon !== 'string') {
      return `descartes[${i}]: tienen que ir titular, url y razon`;
    }
  }
  const n = json.preseleccion.length;
  if (json.ganador !== null && (!Number.isInteger(json.ganador) || json.ganador < 1 || json.ganador > n)) {
    return `ganador: null o índice 1-${n} de la preselección`;
  }
  return null;
}

console.log('Draft A: preselección con scores...');
const candidatos = readFileSync(candidatosPath, 'utf8');
const variedad = recientes.length
  ? `Últimos juegos publicados (fecha, categoría, motor): ${recientes.map((r) => `${r.fecha}: ${r.categoria}/${r.motor}`).join('; ')}.
Variedad (regla dura): hoy NO puede ganar una noticia de categoría "${categoriaProhibida}" (se usó en el último juego).`
  : 'No hay juegos anteriores: sin restricciones de variedad.';

const A = await chatJSON({
  system: `${lineaEditorial}\n\n${criterios}\n\n${contratoA}`,
  user: `Fecha de hoy: ${fecha}.

${variedad}

${memoriaTexto}
${veredictosTexto ? `\n${veredictosTexto}\n` : ''}
Candidatos crudos del radar:

${candidatos}`,
  validar: validarA,
  maxTokens: 3000,
});

if (A.ganador === null) {
  const seleccion = {
    fecha,
    modo: process.env.APROBACION === 'on' ? 'con-aprobacion' : 'full-auto',
    estado: 'SIN_CANDIDATOS',
    preseleccion: A.preseleccion,
    ganador: null,
    event: null,
    pitches: [],
    pitchElegido: null,
    descartes: A.descartes,
    memoria: { consultadas: anteriores.map((a) => a.dia), veredictosInyectados: veredictos ? veredictos.length : 0 },
    advertencias: [],
  };
  writeFileSync(join(radarDir, 'seleccion.json'), `${JSON.stringify(seleccion, null, 2)}\n`);
  writeFileSync(join(radarDir, 'draft.md'), renderSinCandidatos(seleccion));
  console.log(`SIN CANDIDATOS: ${A.descartes.length} descartes registrados. Día sin juego (resultado válido).`);
  process.exit(0);
}

// --- Fetch del artículo ganador ------------------------------------------

const ganador = A.preseleccion[A.ganador - 1];
console.log(`Ganador: "${ganador.titular}". Bajando la nota...`);
const articulo = await fetchArticle(ganador.url);
const contextoNota = articulo.ok
  ? `Texto de la nota (${ganador.url}):\n\n"""\n${articulo.texto}\n"""`
  : `No se pudo bajar la nota (${articulo.motivo}). Los hechos y la posible quote tienen que salir SOLO de los titulares del radar: si un hecho no está afirmado ahí, no entra. Declara en "advertencias" que se trabajó sin texto de nota.`;

// --- Llamada B: Event + pitches ------------------------------------------

function validarB(json) {
  if (json.event === null) return null; // el modelo puede rendirse por variedad
  const event = json.event;
  if (!event) return 'event: falta el Event completo';
  const parsed = eventSchema.safeParse(event);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `"${i.path.join('.')}": ${i.message}`).join('; ');
    return `event no pasa eventSchema: ${issues}`;
  }
  if (categoriaProhibida && event.category === categoriaProhibida) {
    return `event.category "${event.category}" está prohibido hoy por variedad (se usó en el último juego). Elegí otra noticia o devolvé event: null`;
  }
  if (typeof event.id !== 'string' || !event.id.startsWith(`${fecha}-`)) {
    return `event.id tiene que empezar con "${fecha}-" (fecha + slug corto, sin acentos)`;
  }
  if (!Array.isArray(json.pitches) || json.pitches.length !== 3) {
    return 'pitches: tienen que ser exactamente 3';
  }
  const motores = json.pitches.map((p) => p.motor);
  for (const [i, p] of json.pitches.entries()) {
    if (!MOTORES.includes(p.motor)) return `pitches[${i}].motor "${p.motor}": implementados: ${MOTORES.join(', ')}`;
    if (typeof p.nombre !== 'string' || p.nombre.length === 0) return `pitches[${i}].nombre: falta`;
    if (typeof p.chiste !== 'string' || p.chiste.length === 0) return `pitches[${i}].chiste: falta (el chiste jugable, máx 4 líneas)`;
    if (!Number.isInteger(p.scoreChiste) || p.scoreChiste < 1 || p.scoreChiste > 10) return `pitches[${i}].scoreChiste: entero 1-10`;
  }
  if (new Set(motores).size !== 3) return 'pitches: los 3 tienen que usar motores distintos';
  if (typeof json.acidez !== 'string' || json.acidez.length === 0) {
    return 'acidez: falta la declaración según el medidor (verde/amarillo/rojo) con su justificación';
  }
  if (json.segundaJornada != null) {
    const sj = json.segundaJornada;
    if (
      typeof sj !== 'object' ||
      typeof sj.de !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(sj.de) ||
      typeof sj.giro !== 'string' ||
      sj.giro.length === 0
    ) {
      return 'segundaJornada: si va, tiene que ser { de: "YYYY-MM-DD", giro: "qué cambió HOY respecto del juego ya publicado" }';
    }
  }
  return null;
}

console.log('Draft B: Event + pitches...');
const juegoAnterior = recientes.at(-1) ?? null;
const contextoJuegoAnterior = juegoAnterior
  ? `Juego ya publicado (${juegoAnterior.fecha}): "${juegoAnterior.titulo}" (${juegoAnterior.motor}) — evento: ${juegoAnterior.evento}.
Si tu Event es la misma historia, declara "segundaJornada" y el juego tiene que girar sobre qué cambió HOY, no repetir ese chiste.

`
  : '';
const B = await chatJSON({
  system: `${lineaEditorial}\n\n${contratoB}`,
  user: `Fecha de hoy: ${fecha}.
Variedad de motor (regla dura): el juego de ayer fue "${motorProhibido ?? '—'}": ese motor puede aparecer como pitch pero NO puede ser el mejor puntuado si hay alternativa.

${contextoJuegoAnterior}${veredictosTexto ? `${veredictosTexto}\n\n` : ''}${contextoNota}

Datos del ganador: ${JSON.stringify(ganador, null, 2)}`,
  validar: validarB,
  maxTokens: 3500,
});

// Elección automática del pitch: mejor scoreChiste con motor distinto al de ayer.
const elegibles = B.pitches
  .map((p, i) => ({ ...p, indice: i }))
  .filter((p) => p.motor !== motorProhibido);
const pool = elegibles.length > 0 ? elegibles : B.pitches.map((p, i) => ({ ...p, indice: i }));
const pitchElegido = pool.sort((a, b) => b.scoreChiste - a.scoreChiste)[0].indice;
const advertencias = [
  ...(articulo.ok ? [] : [`se trabajó sin texto de nota (${articulo.motivo})`]),
  ...(elegibles.length === 0 ? [`todos los pitches repiten el motor de ayer (${motorProhibido}); se eligió el mejor igual`] : []),
];

const modo = process.env.APROBACION === 'on' ? 'con-aprobacion' : 'full-auto';

// El modelo se rindió por la regla de variedad: día sin juego, registrado.
if (B.event === null) {
  const seleccion = {
    fecha,
    modo,
    estado: 'SIN_CANDIDATOS',
    preseleccion: A.preseleccion,
    ganador: { indice: A.ganador, ...ganador },
    event: null,
    pitches: [],
    pitchElegido: null,
    descartes: A.descartes,
    memoria: { consultadas: anteriores.map((a) => a.dia), reincidente: false, segundaJornada: null, veredictosInyectados: veredictos ? veredictos.length : 0 },
    advertencias: ['la única noticia que pasaba el umbral era de una categoría prohibida por variedad'],
  };
  writeFileSync(join(radarDir, 'seleccion.json'), `${JSON.stringify(seleccion, null, 2)}\n`);
  writeFileSync(join(radarDir, 'draft.md'), renderSinCandidatos(seleccion));
  console.log('SIN CANDIDATOS: el ganador choca con la regla de variedad. Día sin juego.');
  process.exit(0);
}

const estado = modo === 'con-aprobacion' ? 'ESPERANDO_APROBACION' : 'APROBADO_AUTOMATICO';
const memoria = {
  consultadas: anteriores.map((a) => a.dia),
  reincidente: urlsAnteriores.has(ganador.url),
  segundaJornada: B.segundaJornada ?? null,
  veredictosInyectados: veredictos ? veredictos.length : 0,
};
const seleccion = {
  fecha,
  modo,
  estado,
  preseleccion: A.preseleccion,
  ganador: { indice: A.ganador, ...ganador },
  event: B.event,
  acidez: B.acidez,
  pitches: B.pitches,
  pitchElegido,
  descartes: A.descartes,
  memoria,
  advertencias,
};
writeFileSync(join(radarDir, 'seleccion.json'), `${JSON.stringify(seleccion, null, 2)}\n`);
writeFileSync(join(radarDir, 'draft.md'), renderDraft(seleccion));
console.log(`Draft listo: ${B.event.event}`);
console.log(`Pitch elegido (auto): ${B.pitches[pitchElegido].motor} — ${B.pitches[pitchElegido].nombre}`);
console.log(`Escritos: content/radar/${fecha}/seleccion.json y draft.md`);

// --- render de draft.md ---------------------------------------------------

function renderSinCandidatos(seleccion) {
  const descartes = seleccion.descartes.map((d) => `- [${d.titular}](<${d.url}>) — ${d.razon}`).join('\n');
  return `# Draft radar — ${seleccion.fecha}
ESTADO: SIN CANDIDATOS

Ningún titular pasó el umbral (gameability >= 7 + fuente verificable + línea editorial).
Un día sin juego es un resultado válido (docs/runbook-diario.md).

## Descartes

${descartes}
`;
}

function renderDraft(seleccion) {
  const estadoHuman = {
    APROBADO_AUTOMATICO: 'APROBADO AUTOMATICO (gates del pipeline: umbral + variedad + checklist de la casa)',
    ESPERANDO_APROBACION: 'ESPERANDO APROBACIÓN',
  }[seleccion.estado];
  const event = '```json\n' + JSON.stringify(seleccion.event, null, 2) + '\n```';
  const pitches = seleccion.pitches
    .map((p, i) => `${i + 1}. **${p.motor} — ${p.nombre}** (score ${p.scoreChiste}): ${p.chiste}`)
    .join('\n');
  const descartes = seleccion.descartes.map((d) => `- [${d.titular}](<${d.url}>) — ${d.razon}`).join('\n');
  const preseleccion = seleccion.preseleccion
    .map((p) => {
      const s = CRITERIOS.map((c) => `${c} ${p.scores[c]}`).join(', ');
      return `- [${p.titular}](<${p.url}>) — ${s}`;
    })
    .join('\n');
  const advertencias = seleccion.advertencias.length
    ? `\n> Advertencias: ${seleccion.advertencias.join('; ')}\n`
    : '';
  const m = seleccion.memoria ?? {};
  const memoriaLinea = [
    `jornadas consultadas: ${m.consultadas?.join(', ') || '—'}`,
    `reincidente: ${m.reincidente ? 'SÍ' : 'no'}`,
    m.segundaJornada ? `SEGUNDA JORNADA de ${m.segundaJornada.de} — giro: ${m.segundaJornada.giro}` : null,
    `veredictos de jugadores inyectados: ${m.veredictosInyectados ?? 0}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return `# Draft radar — ${seleccion.fecha}
ESTADO: ${seleccion.estado}

Declaración de acidez (medidor de la biblia): ${seleccion.acidez}
${advertencias}
> Memoria del draft: ${memoriaLinea}
## Preselección (scores comparables)

${preseleccion}

## Evento recomendado

${event}

## Pitches (el pipeline elige el mejor por score${seleccion.modo === 'con-aprobacion' ? '; el humano confirma' : ''})

${pitches}

**Elegido automáticamente:** ${seleccion.pitches[seleccion.pitchElegido].motor} — ${seleccion.pitches[seleccion.pitchElegido].nombre}

## Descartes

${descartes}
`;
}
