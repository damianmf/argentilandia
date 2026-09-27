export interface DifficultyParams {
  fallSpeed: number;
  spawnInterval: number;
  goodRatio: number;
}

interface Anchor {
  difficulty: number;
  params: DifficultyParams;
}

const ANCHORS: Anchor[] = [
  { difficulty: 1, params: { fallSpeed: 120, spawnInterval: 1200, goodRatio: 0.8 } },
  { difficulty: 5, params: { fallSpeed: 260, spawnInterval: 700, goodRatio: 0.65 } },
  { difficulty: 10, params: { fallSpeed: 480, spawnInterval: 350, goodRatio: 0.5 } },
];

export function difficultyParams(difficulty: number): DifficultyParams {
  const d = Math.min(10, Math.max(1, difficulty));
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
