import { z } from 'zod';
import type { Event, GameSpec, GameSpecDodge, GameSpecFighter, GameSpecRunner, GameSpecSearch, GameSpecWhack, Outro, ThemeSpec } from './types';

export const sourceRefSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  outlet: z.string().min(1).optional(),
  type: z.enum(['media', 'official']).optional(),
});

export const eventSchema: z.ZodType<Event> = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  event: z.string().min(1),
  category: z.string().min(1),
  actors: z.array(z.string().min(1)),
  conflict: z.string().min(1),
  facts: z.array(z.string().min(1)),
  sources: z.array(sourceRefSchema).min(1),
  virality: z.number().int().min(1).max(10),
  gameability: z.number().int().min(1).max(10),
  humorPotential: z.number().int().min(1).max(10),
  shareability: z.number().int().min(1).max(10),
});

export const catchObjectSchema = z.object({
  emoji: z.string().min(1),
  label: z.string().min(1),
  points: z.number(),
  weight: z.number().positive(),
});

export const specialObjectSchema = catchObjectSchema.extend({
  effect: z.literal('none'),
});

export const tracedRefSchema = z.object({
  source: z.url(),
});

const outroSchema: z.ZodType<Outro> = z
  .object({
    whatHappened: z.string().min(1),
    facts: z.array(z.string().min(1)),
    fiction: z.string().min(1),
    quote: tracedRefSchema
      .extend({
        text: z.string().min(1),
        who: z.string().min(1),
      })
      .optional(),
    moments: z
      .array(
        tracedRefSchema.extend({
          emoji: z.string().min(1),
          text: z.string().min(1),
        }),
      )
      .optional(),
    sources: z.array(sourceRefSchema).min(1),
  })
  .superRefine((outro, ctx) => {
    const urls = new Set(outro.sources.map((source) => source.url));
    if (outro.quote && !urls.has(outro.quote.source)) {
      ctx.addIssue({
        code: 'custom',
        path: ['quote', 'source'],
        message: 'la frase debe trazarse a una source del mismo JSON',
      });
    }
    (outro.moments ?? []).forEach((moment, index) => {
      if (!urls.has(moment.source)) {
        ctx.addIssue({
          code: 'custom',
          path: ['moments', index, 'source'],
          message: 'el momento debe trazarse a una source del mismo JSON',
        });
      }
    });
  });

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'color hex inválido');

const themeSchema: z.ZodType<ThemeSpec> = z.object({
  background: hexColor,
  hud: z
    .object({
      score: hexColor,
      time: hexColor,
    })
    .optional(),
  decor: z
    .array(
      z.object({
        emoji: z.string().min(1),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        size: z.number().int().min(8).max(300).optional(),
        alpha: z.number().min(0).max(1).optional(),
      }),
    )
    .optional(),
});

export const playerSchema = z.object({
  emoji: z.string().min(1),
  label: z.string().min(1),
  image: z.string().min(1).optional(),
});

export const rankingSchema = z.object({
  titulo: z.string().min(1),
  titulos: z.array(z.string().min(1)).min(2).max(8).optional(),
  unidad: z.string().min(1).optional(),
});

export const gameSpecCatcherSchema: z.ZodType<GameSpec> = z.object({
  game: z.literal('catcher'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  catch: z.array(catchObjectSchema).min(1),
  avoid: z.array(catchObjectSchema).min(1),
  special: z.array(specialObjectSchema),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

export const gameSpecDodgeSchema: z.ZodType<GameSpecDodge> = z.object({
  game: z.literal('dodge'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  obstacles: z.array(catchObjectSchema).min(1),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

export const searchItemSchema = z.object({
  emoji: z.string().min(1),
  label: z.string().min(1),
  points: z.number(),
});

export const gameSpecSearchSchema: z.ZodType<GameSpecSearch> = z.object({
  game: z.literal('search'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  grid: z.object({
    width: z.number().int().min(4).max(14),
    height: z.number().int().min(4).max(14),
  }),
  find: z.array(searchItemSchema).min(1),
  traps: z.array(searchItemSchema).min(1),
  maxTouches: z.number().int().min(1),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

export const runnerObstacleSchema = catchObjectSchema.extend({
  kind: z.enum(['jump', 'duck']),
});

export const gameSpecRunnerSchema: z.ZodType<GameSpecRunner> = z.object({
  game: z.literal('runner'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  obstacles: z.array(runnerObstacleSchema).min(1),
  prizes: z.array(catchObjectSchema).min(1),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

export const gameSpecFighterSchema: z.ZodType<GameSpecFighter> = z.object({
  game: z.literal('fighter'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  rival: playerSchema,
  crowd: z.array(z.string().min(1)).optional(),
  punchWords: z.array(z.string().min(1)).optional(),
  rivalWords: z.array(z.string().min(1)).optional(),
  verdicts: z.array(z.string().min(1)).optional(),
  koHits: z.number().int().min(1),
  punchPoints: z.number(),
  hitPenalty: z.number(),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

export const gameSpecWhackSchema: z.ZodType<GameSpecWhack> = z.object({
  game: z.literal('whack'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: playerSchema,
  grid: z.object({
    width: z.number().int().min(4).max(8),
    height: z.number().int().min(2).max(5),
  }),
  targets: z.array(searchItemSchema).min(1),
  noTouch: z.array(searchItemSchema).optional(),
  whackWords: z.array(z.string().min(1)).optional(),
  verdicts: z.array(z.string().min(1)).optional(),
  difficulty: z.number().int().min(1).max(10),
  theme: themeSchema.optional(),
  sound: z.boolean().optional(),
  ranking: rankingSchema.optional(),
  outro: outroSchema,
});

const gameSchemas: Record<string, z.ZodType<GameSpec>> = {
  catcher: gameSpecCatcherSchema,
  dodge: gameSpecDodgeSchema,
  search: gameSpecSearchSchema,
  runner: gameSpecRunnerSchema,
  fighter: gameSpecFighterSchema,
  whack: gameSpecWhackSchema,
};

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseGamespec(json: unknown): ParseResult<GameSpec> {
  const game = (json as { game?: unknown } | null)?.game;
  const known = typeof game === 'string' ? gameSchemas[game] : undefined;
  const order = known
    ? [known, ...Object.values(gameSchemas).filter((schema) => schema !== known)]
    : Object.values(gameSchemas);
  for (const schema of order) {
    const result = schema.safeParse(json);
    if (result.success) {
      return { ok: true, data: result.data as GameSpec };
    }
  }
  const result = (known ?? order[0]).safeParse(json);
  if (result.success) {
    return { ok: true, data: result.data as GameSpec };
  }
  const issues = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'raíz';
    return `"${path}": ${issue.message}`;
  });
  return { ok: false, error: issues.join('\n') };
}
