export type GameType = 'catcher' | 'dodge';

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
}

export interface Outro {
  whatHappened: string;
  facts: string[];
  fiction: string;
  sources: SourceRef[];
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
  outro: Outro;
}

export type GameSpec = GameSpecCatcher | GameSpecDodge;
