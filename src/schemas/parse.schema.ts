import { z } from 'zod';

export const ParseRequestSchema = z.object({
  file: z.string().min(1, 'file content is required'),
  file_type: z.enum(['pdf', 'docx', 'text']),
  language: z.enum(['es', 'en', 'auto']).default('auto'),
});

export type ParseRequest = z.infer<typeof ParseRequestSchema>;
