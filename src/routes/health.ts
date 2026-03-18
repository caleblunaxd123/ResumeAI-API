import type { FastifyInstance } from 'fastify';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request, _reply) => {
    return {
      status: 'ok',
      version: '1.0.0',
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    };
  });
}
