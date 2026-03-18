import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getApp, closeApp, loadSampleCv, toBase64 } from './helpers.js';

// Mock Claude API to avoid real API calls in tests
vi.mock('../src/services/claude.js', () => ({
  parseCvWithClaude: vi.fn().mockResolvedValue({
    personal: {
      nombre_completo: 'Carlos Andrés Mendoza Ríos',
      email: 'carlos.mendoza@gmail.com',
      telefono: '+51 987 654 321',
      ubicacion: 'Lima, Perú',
      linkedin: 'linkedin.com/in/carlosmendoza',
      github: 'github.com/carlosmendoza',
    },
    resumen_profesional: 'Ingeniero de sistemas con más de 7 años de experiencia...',
    experiencia: [
      {
        empresa: 'BCP',
        cargo: 'Desarrollador Senior Backend',
        fecha_inicio: '2021-03',
        fecha_fin: 'presente',
        duracion_meses: 36,
        descripcion: 'Migración a microservicios...',
        logros: ['Redujo tiempo de deploy en 40%', 'Procesó 2M transacciones diarias'],
      },
    ],
    educacion: [
      {
        institucion: 'UPC',
        titulo: 'Ingeniería de Sistemas e Informática',
        fecha_inicio: '2012',
        fecha_fin: '2017',
        grado: 'bachiller',
      },
    ],
    skills: {
      tecnicos: ['Python', 'Node.js', 'AWS', 'PostgreSQL', 'Docker'],
      blandas: ['liderazgo', 'mentoría', 'comunicación'],
      idiomas: [
        { idioma: 'Español', nivel: 'nativo' },
        { idioma: 'Inglés', nivel: 'avanzado' },
      ],
    },
    certificaciones: ['AWS Certified Developer', 'AWS Solutions Architect'],
    años_experiencia_total: 7,
    nivel_seniority: 'senior',
    metadata: {
      idioma_detectado: 'es',
      formato_cv: 'cronologico',
      procesado_en_ms: 1240,
    },
  }),
  scoreCvWithClaude: vi.fn(),
  rankCvsWithClaude: vi.fn(),
}));

describe('POST /v1/parse', () => {
  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  it('parses a Spanish (Peru) CV text successfully', async () => {
    const app = await getApp();
    const cvText = loadSampleCv('cv_peru_senior_dev.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: {
        file: cvText,
        file_type: 'text',
        language: 'es',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.personal).toBeDefined();
    expect(body.data.experiencia).toBeInstanceOf(Array);
    expect(body.data.skills.tecnicos).toBeInstanceOf(Array);
    expect(body.data.nivel_seniority).toBe('senior');
    expect(body.data.metadata.idioma_detectado).toBe('es');
  });

  it('parses an English CV text successfully', async () => {
    const app = await getApp();
    const cvText = loadSampleCv('cv_english_product_manager.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: {
        file: cvText,
        file_type: 'text',
        language: 'en',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.experiencia).toBeInstanceOf(Array);
  });

  it('returns 400 for invalid file_type', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: {
        file: 'some content',
        file_type: 'xlsx', // invalid
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_PAYLOAD');
  });

  it('returns 400 when file is missing', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: {
        file_type: 'text',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it('returns 400 for oversized base64 file', async () => {
    const app = await getApp();
    // Generate a buffer larger than 5MB
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 'A');
    const base64 = bigBuffer.toString('base64');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/parse',
      payload: {
        file: base64,
        file_type: 'pdf',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FILE_TOO_LARGE');
  });
});
