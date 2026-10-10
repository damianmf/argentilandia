export const SCENE_BY_GAME = {
  catcher: 'Catcher',
  dodge: 'Dodge',
  search: 'Search',
  runner: 'Runner',
  fighter: 'Fighter',
  whack: 'Whack',
} as const;

export function urlGameId(): string {
  return new URLSearchParams(window.location.search).get('game') ?? 'demo';
}
