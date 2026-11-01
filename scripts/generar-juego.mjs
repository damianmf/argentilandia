// Paso generación headless (Etapa 2): reemplaza la pasada 2 del agente en sesión.
// N candidatos de GameSpec (default 3) validados contra el schema Zod + juez que
// autopuntúa contra el checklist de la casa; gana el mejor que pase. Si ninguno
// pasa, día sin juego (regla vigente). Salida: content/events/<id>/ completo
// (event.json, gamespec.json, avatar.svg, scores.json, produccion.md).
// Uso: node scripts/generar-juego.mjs <YYYY-MM-DD>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatJSON } from './lib/llm.mjs';
import { extractSection, loadPrompt, solapamiento } from './lib/prompts.mjs';
import { parseGamespec } from '../src/schemas.ts';
import { renderAvatar, validarConfig } from './generar-avatar.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = Number(process.env.N_CANDIDATOS ?? 3);
const UMBRAL_CRITERIO = 6; // ningún criterio por debajo
const UMBRAL_PROMEDIO = 7; // y promedio mínimo del checklist de la casa

const fecha = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '')) {
  console.error('Uso: node scripts/generar-juego.mjs <YYYY-MM-DD>');
  process.exit(1);
}

const radarDir = join(root, 'content', 'radar', fecha);
const seleccionPath = join(radarDir, 'seleccion.json');
if (!existsSync(seleccionPath)) {
  console.error(`No existe ${seleccionPath}. Corré antes el draft (npm run jornada o generar-draft.mjs).`);
  process.exit(1);
}
const seleccion = JSON.parse(readFileSync(seleccionPath, 'utf8'));
if (!seleccion.event || seleccion.pitchElegido === null) {
  console.error(`seleccion.json de ${fecha} no tiene evento/pitch aprobado (estado: ${seleccion.estado}).`);
  process.exit(1);
}

const event = seleccion.event;
const pitch = seleccion.pitches[seleccion.pitchElegido];
const lineaEditorial = loadPrompt('linea-editorial.md');
const promptJuego = loadPrompt('game-generation.md');
const reglas = extractSection(promptJuego, 'Reglas');
const contrato = extractSection(promptJuego, 'Contrato de candidato');
const vocabulario = extractSection(promptJuego, 'Vocabulario de avatar');
const checklist = extractSection(promptJuego, 'Juez — checklist de la casa');

// --- generación de un candidato ------------------------------------------

function revisarCandidato(json) {
  const spec = json.gamespec;
  if (!spec) return 'gamespec: falta el GameSpec completo';
  if (spec.game !== pitch.motor) return `gamespec.game tiene que ser "${pitch.motor}" (el pitch elegido), no "${spec.game}"`;
  const parsed = parseGamespec(spec);
  if (!parsed.ok) return `gamespec no pasa el schema Zod:\n${parsed.error}`;
  const avatarError = validarConfig(json.avatar);
  if (avatarError) return avatarError;
  return null;
}

async function generarCandidato(n) {
  const variacion =
    n === 1
      ? 'Variante 1: el enfoque más directo y obvio del chiste.'
      : n === 2
        ? 'Variante 2: el mismo pitch con OTROS objetos, etiquetas y punchline distinto (buscá el dato más incómodo y verificable).'
        : 'Variante 3: el mismo pitch llevado al extremo más ridículo que respete la línea editorial.';
  const json = await chatJSON({
    system: `${lineaEditorial}\n\n${reglas}\n\n${contrato}\n\n${vocabulario}`,
    user: `Event (pasa el umbral, fuentes verificadas):\n${JSON.stringify(event, null, 2)}\n\nPitch elegido por el pipeline (respetalo, es el chiste ganador):\n${JSON.stringify(pitch, null, 2)}\n\n${variacion}
Reglas duras: difficulty = 5; duration 20 para motores de reflejos (catcher, dodge, runner, whack, fighter) y 30–45 para search; player.image = "avatar.svg"; regla de fuentes del outro (quote y moments trazados a outro.sources, facts solo con fuente).`,
    validar: revisarCandidato,
    retries: 2,
    maxTokens: 8192, // 3 candidatos completos: 4000 quedaba justo y truncaba el JSON
  });
  // Normalizaciones del pipeline (no se delegan en el modelo). Piso de 15:
  // la política real (20 reflejos / 30–45 search) la lleva el contrato.
  json.gamespec.difficulty = 5;
  json.gamespec.duration = Math.min(90, Math.max(15, Math.round(json.gamespec.duration)));
  json.gamespec.player.image = 'avatar.svg';
  return json;
}

// --- juez ------------------------------------------------------------------

function revisarVeredicto(json) {
  const c = json.criterios ?? {};
  for (const criterio of ['chisteJugable', 'punchline', 'acidez', 'fuentes']) {
    if (!Number.isInteger(c[criterio]) || c[criterio] < 0 || c[criterio] > 10) {
      return `criterios.${criterio}: entero 0-10`;
    }
  }
  if (typeof json.nota !== 'string' || json.nota.length === 0) return 'nota: falta (una línea)';
  return null;
}

async function juzgar(candidato, factsDudosos) {
  const spec = candidato.gamespec;
  const resumen = {
    title: spec.title,
    intro: spec.intro,
    player: spec.player,
    rival: spec.rival,
    objetos: spec.catch ?? spec.obstacles ?? spec.targets ?? spec.find,
    noTouch: spec.noTouch,
    verdicts: spec.verdicts ?? spec.whackWords ?? spec.punchWords,
    quote: spec.outro.quote,
    facts: spec.outro.facts,
    fiction: spec.outro.fiction,
    avatar: candidato.avatar,
  };
  const json = await chatJSON({
    system: `${lineaEditorial}\n\n${reglas}\n\n${checklist}`,
    user: `Pitch que se quería lograr: ${JSON.stringify(pitch)}
Event (hechos con fuente): ${JSON.stringify({ event: event.event, facts: event.facts }, null, 2)}

Candidato a evaluar:
${JSON.stringify(resumen, null, 2)}

${factsDudosos.length ? `ALERTA mecánica: estos facts del outro tienen poco respaldo textual en los facts del Event: ${JSON.stringify(factsDudosos)}. Penalizá "fuentes" si confirman tu lectura.` : ''}`,
    validar: revisarVeredicto,
    retries: 1,
    temperature: 0.3,
    maxTokens: 1200,
  });
  const criterios = json.criterios;
  const promedio = (criterios.chisteJugable + criterios.punchline + criterios.acidez + criterios.fuentes) / 4;
  const pasa =
    criterios.chisteJugable >= UMBRAL_CRITERIO &&
    criterios.punchline >= UMBRAL_CRITERIO &&
    criterios.acidez >= UMBRAL_CRITERIO &&
    criterios.fuentes >= UMBRAL_CRITERIO &&
    promedio >= UMBRAL_PROMEDIO;
  return { criterios, promedio: Number(promedio.toFixed(2)), pasa, nota: json.nota };
}

// --- N candidatos -----------------------------------------------------------

console.log(`Generando ${N} candidatos para "${event.event}" (${pitch.motor})...`);
const candidatos = [];
for (let n = 1; n <= N; n++) {
  try {
    const candidato = await generarCandidato(n);
    const factsDudosos = candidato.gamespec.outro.facts.filter(
      (fact) => solapamiento(fact, event.facts) < 0.35,
    );
    console.log(`  candidato ${n}: "${candidato.gamespec.title}" — juzgando...`);
    const veredicto = await juzgar(candidato, factsDudosos);
    candidatos.push({
      n,
      game: candidato.gamespec.game,
      title: candidato.gamespec.title,
      ...veredicto,
      factsDudosos,
      candidato,
    });
    console.log(
      `    criterios ${JSON.stringify(veredicto.criterios)} promedio ${veredicto.promedio} → ${veredicto.pasa ? 'PASA' : 'no pasa'}: ${veredicto.nota}`,
    );
  } catch (error) {
    console.error(`  candidato ${n}: RECHAZADO (${error.message})`);
    candidatos.push({ n, rechazado: true, motivo: error.message });
  }
}

const pasan = candidatos.filter((c) => !c.rechazado && c.pasa);
if (pasan.length === 0) {
  const registro = { fecha, pitch, umbrales: { criterio: UMBRAL_CRITERIO, promedio: UMBRAL_PROMEDIO }, elegido: null, candidatos: candidatos.map(({ candidato, ...rest }) => rest) };
  writeFileSync(join(radarDir, 'scores.json'), `${JSON.stringify(registro, null, 2)}\n`);
  seleccion.estado = 'SIN_JUEGO';
  writeFileSync(seleccionPath, `${JSON.stringify(seleccion, null, 2)}\n`);
  console.error('Ningún candidato pasó el checklist de la casa. Día sin juego (scores.json en content/radar/).');
  process.exit(0);
}

pasan.sort((a, b) => b.promedio - a.promedio || b.criterios.chisteJugable - a.criterios.chisteJugable);
const ganador = pasan[0];
const { candidato, ...veredictoGanador } = ganador;

// --- escritura del evento ---------------------------------------------------

const dirEvento = join(root, 'content', 'events', event.id);
mkdirSync(dirEvento, { recursive: true });
writeFileSync(join(dirEvento, 'event.json'), `${JSON.stringify(event, null, 2)}\n`);
writeFileSync(join(dirEvento, 'gamespec.json'), `${JSON.stringify(candidato.gamespec, null, 2)}\n`);
writeFileSync(join(dirEvento, 'avatar.svg'), renderAvatar(candidato.avatar));
const registro = {
  fecha,
  pitch,
  umbrales: { criterio: UMBRAL_CRITERIO, promedio: UMBRAL_PROMEDIO },
  elegido: { n: ganador.n, ...veredictoGanador },
  candidatos: candidatos.map(({ candidato: c, ...rest }) => rest),
};
writeFileSync(join(dirEvento, 'scores.json'), `${JSON.stringify(registro, null, 2)}\n`);
writeFileSync(
  join(dirEvento, 'produccion.md'),
  `# Producción — ${event.id}

- **Modo:** headless full-auto (Etapa 2, \`npm run jornada\`). Sin aprobación humana previa; auditá este archivo y el juego.
- **Pitch elegido (automático, score ${pitch.scoreChiste}):** ${pitch.motor} — ${pitch.nombre}
- **Candidatos:** ${N} generados, ${pasan.length} pasaron el checklist (umbral: ningún criterio < ${UMBRAL_CRITERIO}, promedio >= ${UMBRAL_PROMEDIO}).
- **Ganador:** variante ${ganador.n} — "${candidato.gamespec.title}" (promedio ${ganador.promedio}). Nota del juez: ${ganador.nota}
- **Scores comparables:** ver \`scores.json\` del mismo directorio.
- **Selección editorial del día:** \`content/radar/${fecha}/seleccion.json\` (preselección, descartes y acidez).
`,
);
console.log(`\nGanador: variante ${ganador.n} — "${candidato.gamespec.title}" (promedio ${ganador.promedio})`);
console.log(`Escrito: content/events/${event.id}/`);
