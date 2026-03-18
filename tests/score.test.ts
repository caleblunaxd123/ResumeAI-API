import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getApp, closeApp, loadSampleCv } from './helpers.js';

const highScoreMock = {
  candidato: 'Carlos Mendoza',
  score_total: 88,
  nivel_match: 'alto',
  scores_detalle: {
    skills_tecnicas: { score: 90, peso: 40 },
    experiencia: { score: 92, peso: 30 },
    educacion: { score: 80, peso: 15 },
    idiomas: { score: 75, peso: 15 },
  },
  skills_match: ['Python', 'AWS', 'PostgreSQL', 'Docker'],
  skills_faltantes: ['Terraform', 'Kubernetes'],
  skills_adicionales: ['React'],
  fortalezas: ['7 años de experiencia relevante', 'Sector financiero', 'AWS certificado'],
  brechas: ['Sin experiencia en Terraform', 'Kubernetes básico'],
  recomendacion: 'Candidato sólido. Recomendado para entrevista técnica.',
  contratar: true,
  metadata: { procesado_en_ms: 1800 },
};

const lowScoreMock = {
  candidato: 'Valeria Flores',
  score_total: 28,
  nivel_match: 'bajo',
  scores_detalle: {
    skills_tecnicas: { score: 10, peso: 40 },
    experiencia: { score: 20, peso: 30 },
    educacion: { score: 50, peso: 15 },
    idiomas: { score: 60, peso: 15 },
  },
  skills_match: [],
  skills_faltantes: ['Python', 'AWS', 'PostgreSQL', 'Docker', 'Terraform'],
  skills_adicionales: ['Canva', 'Meta Ads'],
  fortalezas: ['Inglés básico'],
  brechas: ['Sin experiencia técnica', 'Perfil de marketing vs puesto técnico'],
  recomendacion: 'Candidato no apto para el puesto. Perfil muy diferente al requerido.',
  contratar: false,
  metadata: { procesado_en_ms: 1600 },
};

vi.mock('../src/services/claude.js', () => {
  let callCount = 0;
  return {
    parseCvWithClaude: vi.fn(),
    scoreCvWithClaude: vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? highScoreMock : lowScoreMock);
    }),
    rankCvsWithClaude: vi.fn(),
  };
});

const JD_PYTHON_BACKEND = `
  Buscamos Desarrollador Backend Senior con experiencia en Python y AWS.
  Requisitos: 5+ años experiencia, Python avanzado, AWS (EC2, RDS, Lambda),
  PostgreSQL, Docker, microservicios. Inglés intermedio. Sector fintech preferible.
`;

describe('POST /v1/score', () => {
  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  it('scores a high-match candidate (>80)', async () => {
    const app = await getApp();
    const cvText = loadSampleCv('cv_peru_senior_dev.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/score',
      payload: {
        cv: cvText,
        cv_type: 'text',
        job_description: JD_PYTHON_BACKEND,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.score_total).toBeGreaterThan(80);
    expect(body.data.nivel_match).toBe('alto');
    expect(body.data.contratar).toBe(true);
    expect(body.data.skills_match).toBeInstanceOf(Array);
    expect(body.data.fortalezas.length).toBeGreaterThan(0);
  });

  it('scores a low-match candidate (<40)', async () => {
    const app = await getApp();
    const cvText = loadSampleCv('cv_peru_junior_marketing.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/score',
      payload: {
        cv: cvText,
        cv_type: 'text',
        job_description: JD_PYTHON_BACKEND,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.score_total).toBeLessThan(40);
    expect(body.data.nivel_match).toBe('bajo');
    expect(body.data.contratar).toBe(false);
    expect(body.data.skills_faltantes.length).toBeGreaterThan(0);
  });

  it('rejects request with missing job_description', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/score',
      payload: {
        cv: 'some cv text',
        cv_type: 'text',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_PAYLOAD');
  });

  it('rejects invalid scoring_weights that do not sum to 100', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/score',
      payload: {
        cv: 'some cv text',
        cv_type: 'text',
        job_description: JD_PYTHON_BACKEND,
        scoring_weights: {
          skills_tecnicas: 50,
          experiencia: 50,
          educacion: 20,
          idiomas: 10,
        },
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });
});
