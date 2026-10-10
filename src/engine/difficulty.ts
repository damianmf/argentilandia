export interface DifficultyParams {
  fallSpeed: number;
  spawnInterval: number;
  goodRatio: number;
}

export interface SearchParams {
  findRatio: number;
  trapRatio: number;
}

export interface RunnerParams {
  speed: number;
  spawnInterval: number;
  prizeRatio: number;
}

export interface FighterParams {
  rivalSpeed: number;
  aggression: number;
  rivalCooldown: number;
}

export interface WhackParams {
  upMs: number;
  spawnInterval: number;
}

interface Anchor {
  difficulty: number;
}

const ANCHORS: (Anchor & { params: DifficultyParams })[] = [
  { difficulty: 1, params: { fallSpeed: 120, spawnInterval: 1200, goodRatio: 0.8 } },
  { difficulty: 5, params: { fallSpeed: 260, spawnInterval: 700, goodRatio: 0.65 } },
  { difficulty: 10, params: { fallSpeed: 480, spawnInterval: 350, goodRatio: 0.5 } },
];

const SEARCH_ANCHORS: (Anchor & { params: SearchParams })[] = [
  { difficulty: 1, params: { findRatio: 0.4, trapRatio: 0.1 } },
  { difficulty: 5, params: { findRatio: 0.28, trapRatio: 0.22 } },
  { difficulty: 10, params: { findRatio: 0.15, trapRatio: 0.38 } },
];

const RUNNER_ANCHORS: (Anchor & { params: RunnerParams })[] = [
  { difficulty: 1, params: { speed: 260, spawnInterval: 1500, prizeRatio: 0.45 } },
  { difficulty: 5, params: { speed: 420, spawnInterval: 1000, prizeRatio: 0.35 } },
  { difficulty: 10, params: { speed: 640, spawnInterval: 600, prizeRatio: 0.25 } },
];

const FIGHTER_ANCHORS: (Anchor & { params: FighterParams })[] = [
  { difficulty: 1, params: { rivalSpeed: 130, aggression: 0.7, rivalCooldown: 1200 } },
  { difficulty: 5, params: { rivalSpeed: 210, aggression: 1.0, rivalCooldown: 950 } },
  { difficulty: 10, params: { rivalSpeed: 320, aggression: 1.8, rivalCooldown: 650 } },
];

const WHACK_ANCHORS: (Anchor & { params: WhackParams })[] = [
  { difficulty: 1, params: { upMs: 1400, spawnInterval: 950 } },
  { difficulty: 5, params: { upMs: 1000, spawnInterval: 650 } },
  { difficulty: 10, params: { upMs: 650, spawnInterval: 400 } },
];

export function difficultyParams(difficulty: number): DifficultyParams {
  const d = clamp(difficulty);
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (d <= b.difficulty) {
      const t = (d - a.difficulty) / (b.difficulty - a.difficulty);
      return {
        fallSpeed: lerp(a.params.fallSpeed, b.params.fallSpeed, t),
        spawnInterval: lerp(a.params.spawnInterval, b.params.spawnInterval, t),
        goodRatio: lerp(a.params.goodRatio, b.params.goodRatio, t),
      };
    }
  }
  return ANCHORS[ANCHORS.length - 1].params;
}

export function searchParams(difficulty: number): SearchParams {
  const d = clamp(difficulty);
  for (let i = 0; i < SEARCH_ANCHORS.length - 1; i++) {
    const a = SEARCH_ANCHORS[i];
    const b = SEARCH_ANCHORS[i + 1];
    if (d <= b.difficulty) {
      const t = (d - a.difficulty) / (b.difficulty - a.difficulty);
      return {
        findRatio: lerp(a.params.findRatio, b.params.findRatio, t),
        trapRatio: lerp(a.params.trapRatio, b.params.trapRatio, t),
      };
    }
  }
  return SEARCH_ANCHORS[SEARCH_ANCHORS.length - 1].params;
}

export function runnerParams(difficulty: number): RunnerParams {
  const d = clamp(difficulty);
  for (let i = 0; i < RUNNER_ANCHORS.length - 1; i++) {
    const a = RUNNER_ANCHORS[i];
    const b = RUNNER_ANCHORS[i + 1];
    if (d <= b.difficulty) {
      const t = (d - a.difficulty) / (b.difficulty - a.difficulty);
      return {
        speed: lerp(a.params.speed, b.params.speed, t),
        spawnInterval: lerp(a.params.spawnInterval, b.params.spawnInterval, t),
        prizeRatio: lerp(a.params.prizeRatio, b.params.prizeRatio, t),
      };
    }
  }
  return RUNNER_ANCHORS[RUNNER_ANCHORS.length - 1].params;
}

export function fighterParams(difficulty: number): FighterParams {
  const d = clamp(difficulty);
  for (let i = 0; i < FIGHTER_ANCHORS.length - 1; i++) {
    const a = FIGHTER_ANCHORS[i];
    const b = FIGHTER_ANCHORS[i + 1];
    if (d <= b.difficulty) {
      const t = (d - a.difficulty) / (b.difficulty - a.difficulty);
      return {
        rivalSpeed: lerp(a.params.rivalSpeed, b.params.rivalSpeed, t),
        aggression: lerp(a.params.aggression, b.params.aggression, t),
        rivalCooldown: lerp(a.params.rivalCooldown, b.params.rivalCooldown, t),
      };
    }
  }
  return FIGHTER_ANCHORS[FIGHTER_ANCHORS.length - 1].params;
}

export function whackParams(difficulty: number): WhackParams {
  const d = clamp(difficulty);
  for (let i = 0; i < WHACK_ANCHORS.length - 1; i++) {
    const a = WHACK_ANCHORS[i];
    const b = WHACK_ANCHORS[i + 1];
    if (d <= b.difficulty) {
      const t = (d - a.difficulty) / (b.difficulty - a.difficulty);
      return {
        upMs: lerp(a.params.upMs, b.params.upMs, t),
        spawnInterval: lerp(a.params.spawnInterval, b.params.spawnInterval, t),
      };
    }
  }
  return WHACK_ANCHORS[WHACK_ANCHORS.length - 1].params;
}

function clamp(difficulty: number): number {
  return Math.min(10, Math.max(1, difficulty));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
