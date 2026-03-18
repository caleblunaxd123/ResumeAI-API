import type { FastifyInstance } from 'fastify';
import { RankRequestSchema } from '../schemas/rank.schema.js';
import { parseFileToText } from '../services/fileParser.js';
import { rankCvsWithClaude } from '../services/claude.js';
import { authMiddleware } from '../middleware/auth.js';

export async function rankRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/v1/rank', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = RankRequestSchema.parse(request.body);

      // Parse all CV files to text in parallel
      const parsedCvs = await Promise.all(
        body.cvs.map(async (cv) => ({
          id: cv.id,
          content: await parseFileToText(cv.content, cv.type),
          type: cv.type,
        })),
      );

      const result = await rankCvsWithClaude(
        body.job_description,
        parsedCvs,
        body.top_n ?? parsedCvs.length,
      );

      reply.code(200).send({ success: true, data: result });
    },
  });
}
