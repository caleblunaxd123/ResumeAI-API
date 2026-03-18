import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getApp, closeApp } from './helpers.js';

vi.mock('../src/services/claude.js', () => ({
  parseCvWithClaude: vi.fn(),
  scoreCvWithClaude: vi.fn(),
  rankCvsWithClaude: vi.fn(),
}));

describe('Auth middleware', () => {
  const PROXY_SECRET = 'my-rapidapi-secret';

  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    process.env.RAPIDAPI_PROXY_SECRET = PROXY_SECRET;
    await getApp();
  });

  afterAll(async () => {
    delete process.env.RAPIDAPI_PROXY_SECRET;
    await closeApp();
  });

  it('rejects requests with missing proxy secret header', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: { file: 'hello', file_type: 'text' },
      // No x-rapidapi-proxy-secret header
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_API_KEY');
  });

  it('rejects requests with wrong proxy secret', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: { file: 'hello', file_type: 'text' },
      headers: { 'x-rapidapi-proxy-secret': 'wrong-secret' },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('INVALID_API_KEY');
  });

  it('allows health check without auth', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });
});
