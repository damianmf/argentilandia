import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGamespec } from '../src/schemas.ts';

const eventsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'events');

if (!existsSync(eventsDir)) {
  console.error('No existe content/events/');
  process.exit(1);
}

const dirs = readdirSync(eventsDir)
  .filter((name) => statSync(join(eventsDir, name)).isDirectory())
  .sort();

if (dirs.length === 0) {
  console.error('No hay eventos en content/events/');
  process.exit(1);
}

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
  if (result.ok) {
    console.log(`OK    ${dir} — "${result.data.title}"`);
  } else {
    failures.push(`${dir}\n${result.error}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} gamespec(s) inválido(s):\n`);
  for (const failure of failures) {
    console.error(`✗ ${failure}\n`);
  }
  process.exit(1);
}

console.log(`\n${dirs.length} gamespec(s) válido(s)`);
