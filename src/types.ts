export type GameType = 'catcher' | 'dodge' | 'search' | 'runner' | 'fighter' | 'whack';

export interface SourceRef {
  title: string;
  url: string;
  outlet?: string;
  type?: 'media' | 'official';
}

export interface Event {
  id: string;
  date: string;
  event: string;
  category: string;
  actors: string[];
  conflict: string;
  facts: string[];
  sources: SourceRef[];
  virality: number;
  gameability: number;
  humorPotential: number;
  shareability: number;
}

export interface CatchObject {
  emoji: string;
  label: string;
  points: number;
  weight: number;
}

export interface SpecialObject extends CatchObject {
  effect: 'none';
}

export interface PlayerSpec {
  emoji: string;
  label: string;
  image?: string;
}

export interface ThemeDecor {
  emoji: string;
  x: number;
  y: number;
  size?: number;
  alpha?: number;
}

export interface ThemeSpec {
  background: string;
  hud?: { score?: string; time?: string };
  decor?: ThemeDecor[];
}

export interface OutroQuote {
  text: string;
  who: string;
  source: string;
}

export interface OutroMoment {
  emoji: string;
  text: string;
  source: string;
}

export interface Outro {
  whatHappened: string;
  facts: string[];
  fiction: string;
  quote?: OutroQuote;
  moments?: OutroMoment[];
  sources: SourceRef[];
}

/** Escalafón satírico del día: el marco con el que se muestra y se comparte el puesto. */
export interface RankingSpec {
  titulo: string;
  /** Títulos del escalafón, del mejor al peor puesto */
  titulos?: string[];
  /** Nombre satírico de los puntos */
  unidad?: string;
}

export interface GameSpecCatcher {
  game: Extract<GameType, 'catcher'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  catch: CatchObject[];
  avoid: CatchObject[];
  special: SpecialObject[];
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export interface GameSpecDodge {
  game: Extract<GameType, 'dodge'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  obstacles: CatchObject[];
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export interface SearchItem {
  emoji: string;
  label: string;
  points: number;
}

export interface GridSpec {
  width: number;
  height: number;
}

export interface GameSpecSearch {
  game: Extract<GameType, 'search'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  grid: GridSpec;
  find: SearchItem[];
  traps: SearchItem[];
  maxTouches: number;
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export interface RunnerObstacle extends CatchObject {
  kind: 'jump' | 'duck';
}

export interface GameSpecRunner {
  game: Extract<GameType, 'runner'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  obstacles: RunnerObstacle[];
  prizes: CatchObject[];
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export interface GameSpecFighter {
  game: Extract<GameType, 'fighter'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  rival: PlayerSpec;
  crowd?: string[];
  punchWords?: string[];
  rivalWords?: string[];
  verdicts?: string[];
  koHits: number;
  punchPoints: number;
  hitPenalty: number;
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export interface GameSpecWhack {
  game: Extract<GameType, 'whack'>;
  title: string;
  emoji: string;
  duration: number;
  intro: string;
  player: PlayerSpec;
  grid: GridSpec;
  targets: SearchItem[];
  noTouch?: SearchItem[];
  whackWords?: string[];
  verdicts?: string[];
  difficulty: number;
  theme?: ThemeSpec;
  sound?: boolean;
  ranking?: RankingSpec;
  outro: Outro;
}

export type GameSpec = GameSpecCatcher | GameSpecDodge | GameSpecSearch | GameSpecRunner | GameSpecFighter | GameSpecWhack;
