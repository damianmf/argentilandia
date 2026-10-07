import { z } from 'zod';
import type { Event, GameSpec, GameSpecDodge, GameSpecSearch, ThemeSpec } from './types';

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

export const outroSchema = z.object({
  whatHappened: z.string().min(1),
  facts: z.array(z.string().min(1)),
  fiction: z.string().min(1),
  sources: z.array(sourceRefSchema).min(1),
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
  outro: outroSchema,
});

const gameSchemas: Record<string, z.ZodType<GameSpec>> = {
  catcher: gameSpecCatcherSchema,
  dodge: gameSpecDodgeSchema,
  search: gameSpecSearchSchema,
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
