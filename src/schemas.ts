import { z } from 'zod';
import type { Event, GameSpec, GameSpecDodge } from './types';

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

export const gameSpecCatcherSchema: z.ZodType<GameSpec> = z.object({
  game: z.literal('catcher'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: z.object({
    emoji: z.string().min(1),
    label: z.string().min(1),
  }),
  catch: z.array(catchObjectSchema).min(1),
  avoid: z.array(catchObjectSchema).min(1),
  special: z.array(specialObjectSchema),
  difficulty: z.number().int().min(1).max(10),
  outro: outroSchema,
});

export const gameSpecDodgeSchema: z.ZodType<GameSpecDodge> = z.object({
  game: z.literal('dodge'),
  title: z.string().min(1),
  emoji: z.string().min(1),
  duration: z.number().int().min(1),
  intro: z.string().min(1),
  player: z.object({
    emoji: z.string().min(1),
    label: z.string().min(1),
  }),
  obstacles: z.array(catchObjectSchema).min(1),
  difficulty: z.number().int().min(1).max(10),
  outro: outroSchema,
});

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseGamespec(json: unknown): ParseResult<GameSpec> {
  const game = (json as { game?: unknown } | null)?.game;
  const primary = game === 'dodge' ? gameSpecDodgeSchema : gameSpecCatcherSchema;
  const secondary = game === 'dodge' ? gameSpecCatcherSchema : gameSpecDodgeSchema;
  const result = primary.safeParse(json);
  if (result.success) {
    return { ok: true, data: result.data as GameSpec };
  }
  const fallback = secondary.safeParse(json);
  if (fallback.success) {
    return { ok: true, data: fallback.data as GameSpec };
  }
  const issues = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'raíz';
    return `"${path}": ${issue.message}`;
  });
  return { ok: false, error: issues.join('\n') };
}
