import Phaser from 'phaser';
import { parseGamespec } from './schemas';
import type { GameSpec } from './types';
import { Title } from './scenes/Title';
import { Catcher } from './scenes/Catcher';
import { Dodge } from './scenes/Dodge';
import { Search } from './scenes/Search';
import { Runner } from './scenes/Runner';
import { Outro } from './scenes/Outro';

const WIDTH = 960;
const HEIGHT = 600;

function gameId(): string {
  return new URLSearchParams(window.location.search).get('game') ?? 'demo';
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function showError(message: string): void {
  document.body.innerHTML = `
    <div class="error">
      <h1>ERROR AL CARGAR EL JUEGO</h1>
      <pre>${escapeHtml(message)}</pre>
    </div>`;
}

async function loadGamespec(id: string): Promise<GameSpec> {
  const response = await fetch(`content/events/${id}/gamespec.json`);
  if (!response.ok) {
    throw new Error(`No se encontró el juego "${id}" (HTTP ${response.status}).`);
  }
  const result = parseGamespec(await response.json());
  if (!result.ok) {
    throw new Error(`GameSpec inválido:\n\n${result.error}`);
  }
  return result.data;
}

async function main(): Promise<void> {
  const id = gameId();
  if (!/^[a-z0-9-]+$/i.test(id)) {
    showError(`Id de juego inválido: "${id}"`);
    return;
  }
  let spec: GameSpec;
  try {
    spec = await loadGamespec(id);
  } catch (error) {
    showError((error as Error).message);
    return;
  }
  const play =
    spec.game === 'dodge'
      ? new Dodge(spec)
      : spec.game === 'search'
        ? new Search(spec)
        : spec.game === 'runner'
          ? new Runner(spec)
          : new Catcher(spec);
  if (spec.player.image) {
    spec.player.image = `content/events/${id}/${spec.player.image}`;
  }
  new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game',
    backgroundColor: '#101018',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new Title(spec), play, new Outro(spec)],
  });
}

main();
