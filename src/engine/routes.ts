export const SCENE_BY_GAME = {
  catcher: 'Catcher',
  dodge: 'Dodge',
  search: 'Search',
  runner: 'Runner',
  fighter: 'Fighter',
  whack: 'Whack',
  decide: 'Decide',
} as const;

export function urlGameId(): string {
  return new URLSearchParams(window.location.search).get('game') ?? 'demo';
}
