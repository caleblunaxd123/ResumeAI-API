import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ParseError, ClaudeError } from '../errors.js';

const DOCS_URL = 'https://rapidapi.com/resumeai/resumeai-api/docs';

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Zod validation errors
  if (error instanceof ZodError) {
    reply.code(400).send({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        docs_url: DOCS_URL,
      },
    });
    return;
  }

  // File parsing errors
  if (error instanceof ParseError) {
    const statusMap: Record<string, number> = {
      INVALID_FILE_TYPE: 400,
      FILE_TOO_LARGE: 400,
      INVALID_PAYLOAD: 400,
      PARSE_FAILED: 422,
    };
    reply.code(statusMap[error.code] ?? 422).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        docs_url: DOCS_URL,
      },
    });
    return;
  }

  // Claude API errors
  if (error instanceof ClaudeError) {
    reply.code(422).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        docs_url: DOCS_URL,
      },
    });
    return;
  }

  // Fastify built-in errors (e.g., rate limit)
  const fastifyErr = error as FastifyError;
  if (fastifyErr.statusCode === 429) {
    reply.code(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Upgrade your plan on RapidAPI for higher limits.',
        docs_url: DOCS_URL,
      },
    });
    return;
  }

  if (fastifyErr.statusCode) {
    reply.code(fastifyErr.statusCode).send({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: fastifyErr.message,
        docs_url: DOCS_URL,
      },
    });
    return;
  }

  // Unexpected errors
  reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      docs_url: DOCS_URL,
    },
  });
}
