import { z } from 'zod';
import { BLOCK_TYPE_IDS } from '../world/blockTypes.js';
import { WORLD_HALF_EXTENT } from '../world/grid.js';

const EXTENT = WORLD_HALF_EXTENT;

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

const BlockTypeZ = z.enum(BLOCK_TYPE_IDS as [string, ...string[]]);

export const ActionSchema = z
  .object({
    type: z.enum(['place_block', 'remove_block']),
    block: BlockTypeZ.optional(),
    position: Vec3,
    rotation: Vec3.optional(),
  })
  .superRefine((a, ctx) => {
    if (a.type === 'place_block' && !a.block) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['block'],
        message: 'place_block requires a block field',
      });
    }
    const [x, y, z2] = a.position;
    if (Math.abs(x) > EXTENT || Math.abs(z2) > EXTENT || y < 0 || y > EXTENT * 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['position'],
        message: `position out of bounds (±${EXTENT}, 0..${EXTENT * 2})`,
      });
    }
  });

/**
 * AgentResponse always has narration + actions. When the model needs
 * more info before building, it can set actions=[] and populate
 * clarifyingQuestion (+ optional quick-pick suggestions). This keeps
 * one flat schema instead of a discriminated union that Gemini's
 * structured output struggles with.
 */
export const AgentResponseSchema = z.object({
  narration: z.string().min(1).max(400),
  actions: z.array(ActionSchema).min(0).max(120),
  clarifyingQuestion: z.string().min(1).max(280).optional(),
  suggestions: z.array(z.string().min(1).max(80)).max(4).optional(),
});

export type Action = z.infer<typeof ActionSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

/**
 * Gemini structured-output schema. Kept minimal — descriptions and
 * design guidance live in the system prompt. Gemini has a hard limit
 * on schema FSM states, so verbose schemas fail with 400. Zod runs
 * the strict rules (bounds, conditional requireds) after parse.
 */
export const geminiResponseSchema = {
  type: 'object',
  required: ['narration', 'actions'],
  properties: {
    narration: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'position'],
        properties: {
          type: { type: 'string', enum: ['place_block', 'remove_block'] },
          block: { type: 'string', enum: [...BLOCK_TYPE_IDS] },
          position: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 3,
            maxItems: 3,
          },
          rotation: {
            type: 'array',
            items: { type: 'number' },
            minItems: 3,
            maxItems: 3,
          },
        },
      },
    },
    clarifyingQuestion: { type: 'string' },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const;
