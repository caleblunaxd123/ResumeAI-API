import type { FastifyInstance } from 'fastify';
import { ScoreRequestSchema } from '../schemas/score.schema.js';
import { parseFileToText } from '../services/fileParser.js';
import { scoreCvWithClaude } from '../services/claude.js';
import { authMiddleware } from '../middleware/auth.js';

const DEFAULT_WEIGHTS = {
  skills_tecnicas: 40,
  experiencia: 30,
  educacion: 15,
  idiomas: 15,
};

export async function scoreRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/v1/score', {
    preHandler: authMiddleware,
    handler: async (request, reply) => {
      const body = ScoreRequestSchema.parse(request.body);
      const cvText = await parseFileToText(body.cv, body.cv_type);
      const weights = body.scoring_weights ?? DEFAULT_WEIGHTS;
      const result = await scoreCvWithClaude(cvText, body.job_description, weights);

      reply.code(200).send({ success: true, data: result });
    },
  });
}
