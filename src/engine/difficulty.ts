export interface DifficultyParams {
  fallSpeed: number;
  spawnInterval: number;
  goodRatio: number;
}

export interface SearchParams {
  findRatio: number;
  trapRatio: number;
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

function clamp(difficulty: number): number {
  return Math.min(10, Math.max(1, difficulty));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
