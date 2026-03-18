import type { FastifyRequest, FastifyReply } from 'fastify';

const DOCS_URL = 'https://rapidapi.com/resumeai/resumeai-api/docs';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Read at request time so tests can set process.env after module load
  const configuredSecret = process.env.RAPIDAPI_PROXY_SECRET;

  // In development/test without a proxy secret configured, skip auth
  if (!configuredSecret) {
    return;
  }

  const proxySecret = request.headers['x-rapidapi-proxy-secret'];

  if (!proxySecret || proxySecret !== configuredSecret) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Missing or invalid API key. Subscribe to ResumeAI API on RapidAPI.',
        docs_url: DOCS_URL,
      },
    });
  }
}
