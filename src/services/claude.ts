import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { ParsedCV, ScoredCV, RankResult, RankedCandidate } from '../types/index.js';
import { buildParsePrompt, buildScorePrompt, buildRankPrompt } from './prompts.js';
import { ClaudeError } from '../errors.js';

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

// ─── Parse ────────────────────────────────────────────────────────────────────

export async function parseCvWithClaude(cvText: string): Promise<ParsedCV> {
  const start = Date.now();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildParsePrompt(cvText) }],
  });

  const raw = extractText(message);
  const parsed = parseJson<ParsedCV>(raw, 'CV parse');

  parsed.metadata.procesado_en_ms = Date.now() - start;
  return parsed;
}

// ─── Score ────────────────────────────────────────────────────────────────────

export async function scoreCvWithClaude(
  cvText: string,
  jobDescription: string,
  weights: { skills_tecnicas: number; experiencia: number; educacion: number; idiomas: number },
): Promise<ScoredCV> {
  const start = Date.now();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildScorePrompt(cvText, jobDescription, weights) }],
  });

  const raw = extractText(message);
  const scored = parseJson<ScoredCV>(raw, 'CV score');

  scored.metadata.procesado_en_ms = Date.now() - start;
  return scored;
}

// ─── Rank ─────────────────────────────────────────────────────────────────────

export async function rankCvsWithClaude(
  jobDescription: string,
  cvs: Array<{ id: string; content: string; type: string }>,
  topN: number,
): Promise<RankResult> {
  const start = Date.now();

  const cvsPayload = cvs.map((cv) => ({
    cv_id: cv.id,
    content: cv.content,
  }));

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildRankPrompt(jobDescription, JSON.stringify(cvsPayload, null, 2), cvs.length),
      },
    ],
  });

  const raw = extractText(message);
  const result = parseJson<{ ranking: RankedCandidate[] }>(raw, 'CV rank');

  const fullRanking = result.ranking
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => ({ ...item, posicion: idx + 1 }));

  const scores = fullRanking.map((r) => r.score);
  const stats = {
    score_promedio: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    score_maximo: Math.max(...scores),
    score_minimo: Math.min(...scores),
    candidatos_recomendados: fullRanking.filter((r) => r.score >= 70).length,
  };

  return {
    total_procesados: cvs.length,
    ranking: topN ? fullRanking.slice(0, topN) : fullRanking,
    estadisticas: stats,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(message: Anthropic.Message): string {
  const block = message.content[0];
  if (!block || block.type !== 'text') {
    throw new ClaudeError('PARSE_FAILED', 'No text content in Claude response');
  }
  return block.text.trim();
}

function parseJson<T>(raw: string, context: string): T {
  // Strip markdown code fences if Claude adds them despite instructions
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new ClaudeError('PARSE_FAILED', `Failed to parse ${context} JSON from Claude`);
  }
}

export { ClaudeError } from '../errors.js';
