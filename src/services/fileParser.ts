import { MAX_FILE_SIZE_BYTES } from '../config.js';
import { ParseError } from '../errors.js';

type FileType = 'pdf' | 'docx' | 'text';

/**
 * Parses a base64-encoded file or plain text into a string.
 * Throws structured errors for invalid input.
 */
export async function parseFileToText(
  content: string,
  fileType: FileType,
): Promise<string> {
  if (fileType === 'text') {
    const sanitized = sanitizeText(content);
    if (!sanitized.trim()) throw new ParseError('INVALID_PAYLOAD', 'Text content is empty');
    return sanitized;
  }

  const buffer = decodeBase64(content);
  validateFileSize(buffer);

  if (fileType === 'pdf') return parsePdf(buffer);
  if (fileType === 'docx') return parseDocx(buffer);

  throw new ParseError('INVALID_FILE_TYPE', `Unsupported file type: ${fileType}`);
}

function decodeBase64(base64: string): Buffer {
  try {
    // Strip data URI prefix if present (e.g. "data:application/pdf;base64,...")
    const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
    const buf = Buffer.from(cleaned, 'base64');
    if (buf.length === 0) throw new Error('Empty buffer');
    return buf;
  } catch {
    throw new ParseError('INVALID_PAYLOAD', 'Invalid base64 encoding');
  }
}

function validateFileSize(buffer: Buffer): void {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new ParseError(
      'FILE_TOO_LARGE',
      `File exceeds ${process.env.MAX_FILE_SIZE_MB ?? 5}MB limit`,
    );
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues in test environments
    const pdfParse = await import('pdf-parse').then((m) => m.default);
    const result = await pdfParse(buffer);
    const text = sanitizeText(result.text);
    if (!text.trim()) throw new Error('No text extracted');
    return text;
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError('PARSE_FAILED', 'Could not extract text from PDF');
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = sanitizeText(result.value);
    if (!text.trim()) throw new Error('No text extracted');
    return text;
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError('PARSE_FAILED', 'Could not extract text from DOCX');
  }
}

/**
 * Removes control characters and normalizes whitespace.
 * Does NOT log or store the content for privacy.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes and other control chars except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

export { ParseError } from '../errors.js';
