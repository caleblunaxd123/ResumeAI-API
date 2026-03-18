// ─── Parsed CV types ─────────────────────────────────────────────────────────

export interface PersonalInfo {
  nombre_completo: string | null;
  email: string | null;
  telefono: string | null;
  ubicacion: string | null;
  linkedin: string | null;
  github: string | null;
}

export interface ExperienciaItem {
  empresa: string | null;
  cargo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  duracion_meses: number | null;
  descripcion: string | null;
  logros: string[];
}

export interface EducacionItem {
  institucion: string | null;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  grado: 'tecnico' | 'bachiller' | 'licenciado' | 'magister' | 'doctor' | 'otro' | null;
}

export interface Idioma {
  idioma: string;
  nivel: string;
}

export interface Skills {
  tecnicos: string[];
  blandas: string[];
  idiomas: Idioma[];
}

export interface ParsedCV {
  personal: PersonalInfo;
  resumen_profesional: string | null;
  experiencia: ExperienciaItem[];
  educacion: EducacionItem[];
  skills: Skills;
  certificaciones: string[];
  años_experiencia_total: number | null;
  nivel_seniority: 'junior' | 'semi-senior' | 'senior' | 'lead' | 'manager' | null;
  metadata: {
    idioma_detectado: string;
    formato_cv: string;
    procesado_en_ms: number;
  };
}

// ─── Score types ──────────────────────────────────────────────────────────────

export interface ScoreDetail {
  score: number;
  peso: number;
}

export interface ScoredCV {
  candidato: string;
  score_total: number;
  nivel_match: 'alto' | 'medio' | 'bajo';
  scores_detalle: {
    skills_tecnicas: ScoreDetail;
    experiencia: ScoreDetail;
    educacion: ScoreDetail;
    idiomas: ScoreDetail;
  };
  skills_match: string[];
  skills_faltantes: string[];
  skills_adicionales: string[];
  fortalezas: string[];
  brechas: string[];
  recomendacion: string;
  contratar: boolean;
  metadata: {
    procesado_en_ms: number;
  };
}

// ─── Rank types ───────────────────────────────────────────────────────────────

export interface RankedCandidate {
  posicion: number;
  cv_id: string;
  candidato: string;
  score: number;
  razon_principal: string;
}

export interface RankResult {
  total_procesados: number;
  ranking: RankedCandidate[];
  estadisticas: {
    score_promedio: number;
    score_maximo: number;
    score_minimo: number;
    candidatos_recomendados: number;
  };
}

// ─── Error types ──────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PARSE_FAILED'
  | 'INVALID_PAYLOAD'
  | 'INTERNAL_ERROR';

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    docs_url: string;
  };
}
