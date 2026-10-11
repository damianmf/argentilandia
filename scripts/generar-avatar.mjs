// Avatares paramétricos: muñeco base de caricatura + atributos del cargo/evento
// (banda, camiseta, patillas, gorro, emoción, accesorio). Reemplaza el SVG
// dibujado a mano por evento: el LLM solo elige atributos, el SVG lo arma esto.
// 160×160, fondo transparente, paleta plana, legible a 64 px (linea-editorial.md).
//
// Uso como módulo:  import { renderAvatar, validarConfig } from './generar-avatar.mjs';
// Uso como CLI:     node scripts/generar-avatar.mjs config.json [salida.svg]

import { readFileSync, writeFileSync } from 'node:fs';

const EMOCIONES = ['enojado', 'concentrado', 'panico', 'euforia'];
const PELOS = ['pelo', 'pelada', 'patillas', 'canoso'];
const FACIALES = ['none', 'barba'];
const GORROS = ['none', 'gorra', 'casco', 'sombrero', 'corona'];
const TORSOS = ['traje', 'camiseta', 'uniforme'];
const PROPS = ['none', 'martillo', 'silbato', 'motosierra', 'bandera'];

const HEX = /^#[0-9a-fA-F]{6}$/;

// Valida la config que elige el LLM. Devuelve null si está OK, o el error.
export function validarConfig(config) {
  if (typeof config !== 'object' || config === null) return 'avatar: tiene que ser un objeto';
  for (const campo of ['skin', 'torsoColor', 'accent']) {
    if (!HEX.test(config[campo] ?? '')) return `avatar.${campo}: falta o no es hex #rrggbb`;
  }
  if (!PELOS.includes(config.hair)) return `avatar.hair: "${config.hair}" no está en ${PELOS.join('|')}`;
  if (!EMOCIONES.includes(config.emotion)) return `avatar.emotion: "${config.emotion}" no está en ${EMOCIONES.join('|')}`;
  if (!TORSOS.includes(config.torso)) return `avatar.torso: "${config.torso}" no está en ${TORSOS.join('|')}`;
  if (config.hairColor !== undefined && !HEX.test(config.hairColor)) return 'avatar.hairColor: no es hex';
  if (config.facial !== undefined && !FACIALES.includes(config.facial)) return `avatar.facial: usar ${FACIALES.join('|')}`;
  if (config.headgear !== undefined && !GORROS.includes(config.headgear)) return `avatar.headgear: usar ${GORROS.join('|')}`;
  if (config.prop !== undefined && !PROPS.includes(config.prop)) return `avatar.prop: usar ${PROPS.join('|')}`;
  if (config.propColor !== undefined && !HEX.test(config.propColor)) return 'avatar.propColor: no es hex';
  if (config.banda !== undefined && typeof config.banda !== 'boolean') return 'avatar.banda: true o false';
  return null;
}

// --- piezas -------------------------------------------------------------

function cara(emocion) {
  const tinta = '#22314a';
  const ojos = `<circle cx="70" cy="48" r="4.5" fill="${tinta}"/><circle cx="90" cy="48" r="4.5" fill="${tinta}"/>`;
  switch (emocion) {
    case 'enojado':
      return `<rect x="63" y="38" width="13" height="4" rx="2" fill="${tinta}" transform="rotate(14 63 38)"/>
        <rect x="84" y="38" width="13" height="4" rx="2" fill="${tinta}" transform="rotate(-14 84 38)"/>
        ${ojos}
        <path d="M71 60 q9 -7 18 0" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/>`;
    case 'panico':
      return `<circle cx="70" cy="48" r="7" fill="#ffffff"/><circle cx="90" cy="48" r="7" fill="#ffffff"/>
        <circle cx="70" cy="49" r="3" fill="${tinta}"/><circle cx="90" cy="49" r="3" fill="${tinta}"/>
        <ellipse cx="80" cy="61" rx="5" ry="6.5" fill="${tinta}"/>`;
    case 'euforia':
      return `<path d="M65 48 q5 -6 10 0" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/>
        <path d="M85 48 q5 -6 10 0" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round"/>
        <path d="M69 57 q11 10 22 0 z" fill="${tinta}"/>`;
    default: // concentrado
      return `<rect x="63" y="40" width="13" height="3.5" rx="2" fill="${tinta}"/>
        <rect x="84" y="40" width="13" height="3.5" rx="2" fill="${tinta}"/>
        ${ojos}
        <rect x="72" y="59" width="16" height="3.5" rx="1.75" fill="${tinta}"/>`;
  }
}

function pelo(estado, color) {
  const c = estado === 'canoso' ? '#cfd4dc' : color;
  switch (estado) {
    case 'pelada':
      return '';
    case 'patillas':
      return `<rect x="52" y="40" width="8" height="18" rx="4" fill="${c}"/>
        <rect x="100" y="40" width="8" height="18" rx="4" fill="${c}"/>`;
    default: // pelo / canoso
      return `<path d="M54 40 q6 -22 26 -22 q20 0 26 22 q-26 -12 -52 0" fill="${c}"/>`;
  }
}

function facial(estado, color) {
  if (estado !== 'barba') return '';
  return `<path d="M58 56 q4 16 22 16 q18 0 22 -16 q-6 10 -22 10 q-16 0 -22 -10" fill="${color}"/>`;
}

function gorro(estado, color) {
  switch (estado) {
    case 'gorra':
      return `<path d="M53 40 q4 -24 27 -24 q23 0 27 24 z" fill="${color}"/>
        <rect x="88" y="34" width="28" height="7" rx="3.5" fill="${color}"/>`;
    case 'casco':
      return `<path d="M51 42 q3 -27 29 -27 q26 0 29 27 z" fill="${color}"/>
        <rect x="46" y="38" width="68" height="8" rx="4" fill="${color}"/>`;
    case 'sombrero':
      return `<ellipse cx="80" cy="28" rx="34" ry="7" fill="${color}"/>
        <rect x="64" y="4" width="32" height="24" rx="4" fill="${color}"/>`;
    case 'corona':
      return `<path d="M58 30 l4 -22 10 12 8 -16 8 16 10 -12 4 22 z" fill="${color}"/>`;
    default:
      return '';
  }
}

function torso(estado, color, accent, banda) {
  const base = `<rect x="42" y="72" width="76" height="60" rx="14" fill="${color}"/>`;
  const camisa = estado === 'traje' ? `<path d="M72 72 h16 v14 l-8 8 -8 -8 z" fill="#ffffff"/><rect x="76" y="82" width="8" height="20" rx="3" fill="${accent}"/>` : '';
  const franja = estado === 'camiseta' ? `<rect x="42" y="86" width="76" height="12" fill="${accent}"/>` : '';
  const cinturon = estado === 'uniforme' ? `<rect x="42" y="118" width="76" height="10" fill="#1d2433"/><rect x="74" y="119" width="12" height="8" rx="2" fill="${accent}"/>` : '';
  const bandaSvg = banda
    ? `<g transform="rotate(26 80 102)"><rect x="70" y="70" width="18" height="22" fill="#74acdf"/><rect x="70" y="92" width="18" height="16" fill="#ffffff"/><rect x="70" y="108" width="18" height="24" fill="#74acdf"/></g>`
    : '';
  return `${base}${camisa}${franja}${cinturon}${bandaSvg}`;
}

function accesorio(estado, color) {
  switch (estado) {
    case 'martillo':
      return `<rect x="108" y="82" width="36" height="12" rx="6" fill="#1d2433"/>
        <circle cx="146" cy="86" r="9" fill="#f2c89b"/>
        <rect x="140" y="48" width="10" height="34" rx="4" fill="${color}" transform="rotate(16 145 60)"/>
        <rect x="124" y="38" width="40" height="15" rx="5" fill="${color}" transform="rotate(16 144 45)"/>`;
    case 'silbato':
      return `<rect x="108" y="84" width="34" height="12" rx="6" fill="#1d2433"/>
        <circle cx="146" cy="88" r="9" fill="#f2c89b"/>
        <circle cx="141" cy="70" r="11" fill="${color}"/><circle cx="141" cy="70" r="5" fill="#1d2433"/>
        <rect x="148" y="66" width="10" height="8" rx="3" fill="${color}"/>`;
    case 'motosierra':
      return `<rect x="108" y="82" width="30" height="12" rx="6" fill="#1d2433"/>
        <circle cx="146" cy="86" r="9" fill="#f2c89b"/>
        <rect x="112" y="52" width="16" height="30" rx="6" fill="${color}"/>
        <rect x="126" y="58" width="34" height="10" rx="5" fill="#9aa3af"/>
        <path d="M128 52 l6 -6 6 6 6 -6 6 6 6 -6 0 22 -30 0 z" fill="#9aa3af" opacity="0"/>`;
    case 'bandera':
      return `<rect x="108" y="82" width="34" height="12" rx="6" fill="#1d2433"/>
        <circle cx="146" cy="86" r="9" fill="#f2c89b"/>
        <rect x="140" y="26" width="5" height="52" rx="2.5" fill="#8a5a2b"/>
        <path d="M145 28 h24 l-6 9 6 9 h-24 z" fill="${color}"/>`;
    default:
      return '';
  }
}

// Sin accesorio el brazo derecho queda libre: espejo del izquierdo para no
// dibujar un muñeco manco.
function brazoLibre(estado, color, skin) {
  if (estado !== 'none') return '';
  return `<rect x="104" y="90" width="32" height="12" rx="6" fill="${color}" transform="rotate(-20 136 90)"/>
    <circle cx="133" cy="106" r="8" fill="${skin}"/>`;
}

// Devuelve el SVG completo del muñeco con la config dada.
export function renderAvatar(config) {
  const error = validarConfig(config);
  if (error) throw new Error(error);
  const hairColor = config.hairColor ?? '#5a5f6e';
  const facialColor = config.hairColor ?? '#5a5f6e';
  const propColor = config.propColor ?? '#8a5a2b';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect x="56" y="126" width="16" height="30" rx="7" fill="#1d2433"/>
  <rect x="88" y="126" width="16" height="30" rx="7" fill="#1d2433"/>
  <rect x="24" y="90" width="32" height="12" rx="6" fill="${config.torsoColor}" transform="rotate(20 24 90)"/>
  <circle cx="27" cy="106" r="8" fill="${config.skin}"/>
  ${torso(config.torso, config.torsoColor, config.accent, config.banda === true)}
  ${brazoLibre(config.prop ?? 'none', config.torsoColor, config.skin)}
  ${accesorio(config.prop ?? 'none', propColor)}
  <circle cx="80" cy="46" r="27" fill="${config.skin}"/>
  ${pelo(config.hair, hairColor)}
  ${facial(config.facial ?? 'none', facialColor)}
  ${cara(config.emotion)}
  ${gorro(config.headgear ?? 'none', config.accent)}
</svg>
`;
}

// CLI de prueba: node scripts/generar-avatar.mjs config.json [salida.svg]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada) {
    console.error('Uso: node scripts/generar-avatar.mjs <config.json> [salida.svg]');
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(entrada, 'utf8'));
  const svg = renderAvatar(config);
  if (salida) {
    writeFileSync(salida, svg);
    console.log(`Escrito: ${salida}`);
  } else {
    console.log(svg);
  }
}
