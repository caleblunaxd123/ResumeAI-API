import type { FastifyInstance } from 'fastify';
import { ParseRequestSchema } from '../schemas/parse.schema.js';
import { parseFileToText } from '../services/fileParser.js';
import { parseCvWithClaude } from '../services/claude.js';
import { authMiddleware } from '../middleware/auth.js';

export async function parseRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/v1/parse', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = ParseRequestSchema.parse(request.body);
      const cvText = await parseFileToText(body.file, body.file_type);
      const result = await parseCvWithClaude(cvText);

      reply.code(200).send({ success: true, data: result });
    },
  });
}
