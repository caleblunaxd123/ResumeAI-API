// ─── Parse prompt ─────────────────────────────────────────────────────────────

export const PARSE_SCHEMA = `{
  "personal": {
    "nombre_completo": "string | null",
    "email": "string | null",
    "telefono": "string | null",
    "ubicacion": "string | null",
    "linkedin": "string | null",
    "github": "string | null"
  },
  "resumen_profesional": "string | null",
  "experiencia": [
    {
      "empresa": "string | null",
      "cargo": "string | null",
      "fecha_inicio": "YYYY-MM | null",
      "fecha_fin": "YYYY-MM | 'presente' | null",
      "duracion_meses": "number | null",
      "descripcion": "string | null",
      "logros": ["string"]
    }
  ],
  "educacion": [
    {
      "institucion": "string | null",
      "titulo": "string | null",
      "fecha_inicio": "YYYY | null",
      "fecha_fin": "YYYY | 'presente' | null",
      "grado": "tecnico | bachiller | licenciado | magister | doctor | otro | null"
    }
  ],
  "skills": {
    "tecnicos": ["string"],
    "blandas": ["string"],
    "idiomas": [{ "idioma": "string", "nivel": "string" }]
  },
  "certificaciones": ["string"],
  "años_experiencia_total": "number | null",
  "nivel_seniority": "junior | semi-senior | senior | lead | manager | null",
  "metadata": {
    "idioma_detectado": "es | en | other",
    "formato_cv": "cronologico | funcional | combinado | otro",
    "procesado_en_ms": 0
  }
}`;

export function buildParsePrompt(cvText: string): string {
  return `Eres un extractor experto de información de CVs/Resúmenes profesionales. Tu tarea es extraer toda la información de este CV y devolverla en JSON estricto.

REGLAS CRÍTICAS:
- Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, sin markdown, sin backticks
- Si un campo no existe en el CV, usa null
- Normaliza fechas al formato YYYY-MM cuando sea posible
- Para "nivel_seniority" usa exactamente: "junior", "semi-senior", "senior", "lead", "manager"
- Para "grado" de educación usa: "tecnico", "bachiller", "licenciado", "magister", "doctor", "otro"
- Detecta el idioma del CV automáticamente
- Extrae logros cuantificables separados de la descripción general cuando los encuentres
- Si detectas un CV en español latinoamericano, adapta los campos en consecuencia
  (ej: "Datos personales", "DNI", "RUC", secciones típicas de Perú/México/etc)
- El campo "procesado_en_ms" déjalo en 0, se calculará externamente

CV A PARSEAR:
${cvText}

Responde con el JSON siguiendo exactamente este schema:
${PARSE_SCHEMA}`;
}

// ─── Score prompt ─────────────────────────────────────────────────────────────

export const SCORE_SCHEMA = `{
  "candidato": "string",
  "score_total": "number (0-100)",
  "nivel_match": "alto | medio | bajo",
  "scores_detalle": {
    "skills_tecnicas": { "score": "number", "peso": "number" },
    "experiencia": { "score": "number", "peso": "number" },
    "educacion": { "score": "number", "peso": "number" },
    "idiomas": { "score": "number", "peso": "number" }
  },
  "skills_match": ["string"],
  "skills_faltantes": ["string"],
  "skills_adicionales": ["string"],
  "fortalezas": ["string"],
  "brechas": ["string"],
  "recomendacion": "string",
  "contratar": "boolean",
  "metadata": { "procesado_en_ms": 0 }
}`;

export function buildScorePrompt(
  cvText: string,
  jobDescription: string,
  weights: { skills_tecnicas: number; experiencia: number; educacion: number; idiomas: number },
): string {
  return `Eres un evaluador experto de candidatos laborales con 15 años de experiencia en RRHH técnico. Tu tarea es evaluar qué tan bien encaja un candidato para un puesto específico.

REGLAS CRÍTICAS:
- Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, sin markdown
- Los scores son enteros de 0 a 100
- Sé objetivo y específico — las razones deben referenciar información real del CV
- "contratar" es true si score_total >= 70
- "nivel_match" es "alto" (>=80), "medio" (>=55), "bajo" (<55)
- Considera el contexto del mercado laboral latinoamericano si el CV es en español
- Los pesos de scoring son: skills_tecnicas=${weights.skills_tecnicas}%, experiencia=${weights.experiencia}%, educacion=${weights.educacion}%, idiomas=${weights.idiomas}%
- El campo "procesado_en_ms" déjalo en 0, se calculará externamente

CV DEL CANDIDATO:
${cvText}

DESCRIPCIÓN DEL PUESTO:
${jobDescription}

Responde con el JSON siguiendo exactamente este schema:
${SCORE_SCHEMA}`;
}

// ─── Rank prompt ──────────────────────────────────────────────────────────────

export const RANK_SCHEMA = `{
  "ranking": [
    {
      "cv_id": "string",
      "candidato": "string",
      "score": "number (0-100)",
      "razon_principal": "string (1 frase concisa)"
    }
  ]
}`;

export function buildRankPrompt(
  jobDescription: string,
  cvsJson: string,
  count: number,
): string {
  return `Eres un evaluador experto de candidatos. Debes rankear ${count} CVs para el siguiente puesto. Evalúa cada CV de forma independiente pero consistente.

REGLAS CRÍTICAS:
- Responde ÚNICAMENTE con JSON válido
- Mantén criterios de evaluación consistentes entre todos los CVs
- El ranking debe estar ordenado del mayor al menor score
- Para cada CV solo necesito: cv_id, candidato (nombre), score (0-100), razon_principal (1 frase)
- Incluye TODOS los CVs en el ranking, no solo el top

DESCRIPCIÓN DEL PUESTO:
${jobDescription}

CVs A EVALUAR:
${cvsJson}

Responde con el JSON del ranking completo siguiendo este schema:
${RANK_SCHEMA}`;
}
