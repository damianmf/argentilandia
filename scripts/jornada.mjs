// Orquestador de la jornada diaria (Etapa 2, full-auto):
// radar → draft → generación (N candidatos + juez) → validate → index → commit+push.
// Idempotente: si ya existe un evento con la fecha de hoy, no hace nada.
// El push a main deploya (Cloudflare Workers Builds). Des-publicar = un commit.
//
// Uso: node scripts/jornada.mjs [YYYY-MM-DD] [--seco]
//   --seco          no commitea ni pushea (para probar)
//   APROBACION=on   corta después del draft esperando OK humano (modo anterior)
// Códigos de salida: 0 jornada resuelta (con juego, sin juego o ya producida),
// 2 esperando aprobación, 1 error real.

import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const inicio = Date.now();

function hoy() {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const args = process.argv.slice(2);
const seco = args.includes('--seco');
const fecha = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? hoy();
const modo = process.env.APROBACION === 'on' ? 'con-aprobacion' : 'full-auto';

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', encoding: 'utf8' });
  return r.status ?? 1;
}

function terminar(resumen, codigo) {
  resumen.fecha = fecha;
  resumen.modo = modo;
  resumen.seco = seco;
  resumen.segundos = Math.round((Date.now() - inicio) / 1000);
  const linea = `RESUMEN: ${JSON.stringify(resumen)}`;
  if (codigo === 0) console.log(linea);
  else console.error(linea);
  process.exit(codigo);
}

// 1. Chequeo: ¿ya se produjo hoy?
const eventsDir = join(root, 'content', 'events');
const yaHoy = existsSync(eventsDir)
  ? readdirSync(eventsDir).find((name) => name.startsWith(`${fecha}-`))
  : undefined;
if (yaHoy) {
  terminar({ estado: 'YA_PRODUCIDA', evento: yaHoy }, 0);
}

// 2. Radar
console.log(`— radar ${fecha} —`);
if (run('node', ['scripts/radar.mjs', fecha]) !== 0) {
  terminar({ estado: 'SIN_RADAR', detalle: 'ningún feed respondió; día sin juego' }, 0);
}

// 3. Draft (preselección + Event + pitches)
console.log(`— draft ${fecha} —`);
if (run('node', ['scripts/generar-draft.mjs', fecha]) !== 0) {
  terminar({ estado: 'FALLO_DRAFT' }, 1);
}
const seleccionPath = join(root, 'content', 'radar', fecha, 'seleccion.json');
const seleccion = JSON.parse(readFileSync(seleccionPath, 'utf8'));

if (seleccion.estado === 'SIN_CANDIDATOS') {
  terminar({ estado: 'SIN_CANDIDATOS', detalle: 'nada pasó el umbral; día sin juego (válido)' }, 0);
}
if (seleccion.estado === 'ESPERANDO_APROBACION') {
  const p = seleccion.pitches[seleccion.pitchElegido];
  terminar(
    {
      estado: 'ESPERANDO_APROBACION',
      evento: seleccion.event.event,
      pitch: `${p.motor} — ${p.nombre}`,
      draft: `content/radar/${fecha}/draft.md`,
    },
    2,
  );
}

// 4. Generación (N candidatos + juez)
console.log(`— generación ${fecha} —`);
if (run('node', ['scripts/generar-juego.mjs', fecha]) !== 0) {
  terminar({ estado: 'FALLO_GENERACION' }, 1);
}
const idEvento = readdirSync(eventsDir).find((name) => name.startsWith(`${fecha}-`));
if (!idEvento) {
  terminar({ estado: 'SIN_JUEGO', detalle: 'ningún candidato pasó el checklist; día sin juego (válido)' }, 0);
}

// 5. validate en 0 es regla dura: si falla, el evento del día se borra y la web no se toca.
console.log('— validate —');
if (run('npm', ['run', 'validate']) !== 0) {
  rmSync(join(eventsDir, idEvento), { recursive: true, force: true });
  run('npm', ['run', 'index']);
  terminar({ estado: 'RECHAZADO_POR_VALIDACION', evento: idEvento, detalle: 'evento borrado; la web no se tocó' }, 1);
}

// 6. Web (chooser) y commit
console.log('— index —');
if (run('npm', ['run', 'index']) !== 0) {
  terminar({ estado: 'FALLO_INDEX' }, 1);
}

// 6.5 Pack de difusión (no bloqueante: si falla, la jornada igual se publica)
console.log('— pack de difusión —');
if (run('node', ['scripts/pack-difusion.mjs', fecha]) !== 0) {
  console.warn('⚠ pack de difusión falló; la publicación sigue igual');
}

const resumen = {
  estado: 'PUBLICADA',
  evento: idEvento,
  titulo: seleccion.pitches[seleccion.pitchElegido].nombre,
};

if (seco) {
  terminar({ ...resumen, detalle: '--seco: sin commit ni push' }, 0);
}

console.log('— commit + push —');
const rutas = [`content/radar/${fecha}`, `content/events/${idEvento}`, 'web/index.html'];
const status = spawnSync('git', ['status', '--porcelain', '--', ...rutas], { cwd: root, encoding: 'utf8' });
if (!status.stdout?.trim()) {
  terminar({ ...resumen, detalle: 'nada para commitear' }, 0);
}
const add = spawnSync('git', ['add', ...rutas], { cwd: root, encoding: 'utf8' });
const commit = spawnSync('git', ['commit', '-m', `jornada-${fecha}`], { cwd: root, encoding: 'utf8' });
if (add.status !== 0 || commit.status !== 0) {
  console.error(commit.stderr || add.stderr);
  terminar({ ...resumen, estado: 'FALLO_COMMIT' }, 1);
}
const push = spawnSync('git', ['push', 'origin', 'HEAD'], { cwd: root, encoding: 'utf8' });
if (push.status !== 0) {
  console.error(push.stderr);
  terminar({ ...resumen, estado: 'COMMIT_SIN_PUSH', detalle: 'commiteado local; el push (deploy) falló' }, 1);
}
terminar({ ...resumen, commit: commit.stdout?.trim().split('\n')[0] ?? `jornada-${fecha}`, pushed: true }, 0);
