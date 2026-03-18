import { z } from 'zod';

const CvItemSchema = z.object({
  id: z.string().min(1, 'cv id is required'),
  content: z.string().min(1, 'cv content is required'),
  type: z.enum(['pdf', 'docx', 'text']),
});

export const RankRequestSchema = z
  .object({
    cvs: z
      .array(CvItemSchema)
      .min(2, 'At least 2 CVs required')
      .max(20, 'Maximum 20 CVs per request'),
    job_description: z.string().min(10, 'job_description must be at least 10 characters'),
    language: z.enum(['es', 'en', 'auto']).default('auto'),
    top_n: z.number().int().min(1).max(20).optional(),
  })
  .refine(
    (data) => !data.top_n || data.top_n <= data.cvs.length,
    { message: 'top_n cannot exceed the number of CVs provided' },
  );

export type RankRequest = z.infer<typeof RankRequestSchema>;
