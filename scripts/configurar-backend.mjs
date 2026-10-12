// Configuración única del backend de comentarios/ranking (Etapa usuario):
//   1. verifica `wrangler login`,
//   2. crea la base D1 "juego-actualidad" (si wrangler.jsonc todavía no la tiene),
//   3. cuelga el worker (main + bindings ASSETS/DB) en wrangler.jsonc,
//   4. aplica worker/schema.sql contra la base remota.
// Idempotente: si wrangler.jsonc ya tiene d1_databases, solo re-aplica el schema.
// Uso: wrangler login && npm run backend:setup   → después, commit + push (deploya).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'juego-actualidad';
const configPath = join(root, 'wrangler.jsonc');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  r.outputText = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  return r;
}

// 1. Auth
const whoami = run('npx', ['wrangler', 'whoami']);
if (whoami.status !== 0 || /not authenticated/i.test(whoami.outputText)) {
  console.error('Wrangler sin autenticar. Corré primero: npx wrangler login');
  process.exit(1);
}

// 2/3. wrangler.jsonc: main + binding ASSETS + d1_databases
const config = readFileSync(configPath, 'utf8');
if (!config.includes('"d1_databases"')) {
  const creado = run('npx', ['wrangler', 'd1', 'create', BASE]);
  const id = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(creado.outputText)?.[1];
  if (!id) {
    console.error(`No pude obtener el database_id de la salida de wrangler:\n${creado.outputText}`);
    process.exit(1);
  }
  const nuevo = config
    .replace(
      /("not_found_handling":\s*"404-page")(\s*\n\s*\})/,
      `$1,\n    "binding": "ASSETS"\n  },\n  "d1_databases": [\n    {\n      "binding": "DB",\n      "database_name": "${BASE}",\n      "database_id": "${id}"\n    }\n  ]`,
    )
    .replace(
      '"name": "juego-de-la-actualidad",',
      '"name": "juego-de-la-actualidad",\n  "main": "worker/index.mjs",',
    );
  if (!nuevo.includes('"d1_databases"') || !nuevo.includes('"main"') || !nuevo.includes('"binding": "ASSETS"')) {
    console.error('wrangler.jsonc no tiene la forma esperada: parchá a mano (main + assets.binding + d1_databases).');
    process.exit(1);
  }
  writeFileSync(configPath, nuevo);
  console.log(`wrangler.jsonc actualizado (D1 ${id}).`);
} else {
  console.log('wrangler.jsonc ya tiene el backend configurado.');
}

// 4. Schema remoto
const schema = run('npx', ['wrangler', 'd1', 'execute', BASE, '--remote', '--file=worker/schema.sql', '-y']);
if (schema.status !== 0) {
  console.error(`Fallo aplicando el schema:\n${schema.outputText}`);
  process.exit(1);
}
console.log('Schema aplicado en remoto.');
console.log('Listo: commit + push deploya el sitio con /api (ranking + comentarios).');
