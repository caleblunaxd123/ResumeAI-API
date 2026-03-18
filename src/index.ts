import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config, MAX_FILE_SIZE_BYTES } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { parseRoutes } from './routes/parse.js';
import { scoreRoutes } from './routes/score.js';
import { rankRoutes } from './routes/rank.js';

export async function buildApp() {
  // Allow bodies up to ~2x the file limit to accommodate base64 overhead + JSON wrapper
  const fastify = Fastify({
    bodyLimit: MAX_FILE_SIZE_BYTES * 3,
    logger: {
      level: config.LOG_LEVEL,
      serializers: {
        req(req) {
          // Do NOT log request bodies — CVs contain private data
          return {
            method: req.method,
            url: req.url,
            hostname: req.hostname,
          };
        },
      },
    },
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)} seconds.`,
        docs_url: 'https://rapidapi.com/resumeai/resumeai-api/docs',
      },
    }),
  });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(parseRoutes);
  await fastify.register(scoreRoutes);
  await fastify.register(rankRoutes);

  return fastify;
}

// Only start the server if this is the entry point (not imported by tests)
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  buildApp()
    .then((app) => app.listen({ port: config.PORT, host: '0.0.0.0' }))
    .then(() => {
      console.log(`ResumeAI API running on port ${config.PORT}`);
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
