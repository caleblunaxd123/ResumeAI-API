import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getApp, closeApp, loadSampleCv } from './helpers.js';

vi.mock('../src/services/claude.js', () => ({
  parseCvWithClaude: vi.fn(),
  scoreCvWithClaude: vi.fn(),
  rankCvsWithClaude: vi.fn().mockResolvedValue({
    total_procesados: 5,
    ranking: [
      { posicion: 1, cv_id: 'cv_001', candidato: 'Carlos Mendoza', score: 88, razon_principal: 'Experiencia exacta en Python y AWS con sector fintech' },
      { posicion: 2, cv_id: 'cv_003', candidato: 'Rodrigo Gutiérrez', score: 72, razon_principal: 'Fuerte en data science, algo de backend' },
      { posicion: 3, cv_id: 'cv_005', candidato: 'Daniela Ospina', score: 55, razon_principal: 'Skills de diseño no aplican al rol técnico' },
      { posicion: 4, cv_id: 'cv_004', candidato: 'Sophia Thompson', score: 48, razon_principal: 'PM profile, no backend engineer' },
      { posicion: 5, cv_id: 'cv_002', candidato: 'Valeria Flores', score: 22, razon_principal: 'Perfil de marketing, sin skills técnicas requeridas' },
    ],
    estadisticas: {
      score_promedio: 57,
      score_maximo: 88,
      score_minimo: 22,
      candidatos_recomendados: 2,
    },
  }),
}));

const JD = `
  Senior Backend Developer — Python + AWS.
  5+ years experience, Python advanced, AWS, PostgreSQL, Docker, microservices.
  Fintech sector preferred. Intermediate English minimum.
`;

describe('POST /v1/rank', () => {
  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  it('ranks 5 CVs and returns ordered results with statistics', async () => {
    const app = await getApp();

    const cvs = [
      { id: 'cv_001', content: loadSampleCv('cv_peru_senior_dev.txt'), type: 'text' },
      { id: 'cv_002', content: loadSampleCv('cv_peru_junior_marketing.txt'), type: 'text' },
      { id: 'cv_003', content: loadSampleCv('cv_mexico_data_scientist.txt'), type: 'text' },
      { id: 'cv_004', content: loadSampleCv('cv_english_product_manager.txt'), type: 'text' },
      { id: 'cv_005', content: loadSampleCv('cv_colombia_disenador.txt'), type: 'text' },
    ];

    const response = await app.inject({
      method: 'POST',
      url: '/v1/rank',
      payload: {
        cvs,
        job_description: JD,
        top_n: 5,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.total_procesados).toBe(5);
    expect(body.data.ranking).toHaveLength(5);
    expect(body.data.ranking[0].posicion).toBe(1);
    // Verify ranking is ordered by score descending
    const scores = body.data.ranking.map((r: { score: number }) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    // Check statistics
    expect(body.data.estadisticas.score_maximo).toBeGreaterThan(body.data.estadisticas.score_minimo);
    expect(body.data.estadisticas.candidatos_recomendados).toBeGreaterThanOrEqual(0);
  });

  it('rejects fewer than 2 CVs', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/rank',
      payload: {
        cvs: [{ id: 'cv_001', content: 'some cv', type: 'text' }],
        job_description: JD,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it('rejects more than 20 CVs', async () => {
    const app = await getApp();
    const cvs = Array.from({ length: 21 }, (_, i) => ({
      id: `cv_${i}`,
      content: 'some cv text',
      type: 'text',
    }));

    const response = await app.inject({
      method: 'POST',
      url: '/v1/rank',
      payload: { cvs, job_description: JD },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });
});
