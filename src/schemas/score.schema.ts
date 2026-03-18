import { z } from 'zod';

const WeightsSchema = z
  .object({
    skills_tecnicas: z.number().int().min(0).max(100).default(40),
    experiencia: z.number().int().min(0).max(100).default(30),
    educacion: z.number().int().min(0).max(100).default(15),
    idiomas: z.number().int().min(0).max(100).default(15),
  })
  .refine(
    (w) => w.skills_tecnicas + w.experiencia + w.educacion + w.idiomas === 100,
    { message: 'scoring_weights must sum to 100' },
  );

export const ScoreRequestSchema = z.object({
  cv: z.string().min(1, 'cv content is required'),
  cv_type: z.enum(['pdf', 'docx', 'text']),
  job_description: z.string().min(10, 'job_description must be at least 10 characters'),
  language: z.enum(['es', 'en', 'auto']).default('auto'),
  scoring_weights: WeightsSchema.optional(),
});

export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;
