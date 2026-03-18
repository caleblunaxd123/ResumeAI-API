import { readFileSync } from 'fs';
import { join } from 'path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/index.js';

export function loadSampleCv(filename: string): string {
  const filePath = join(process.cwd(), 'sample-cvs', filename);
  return readFileSync(filePath, 'utf-8');
}

export function toBase64(text: string): string {
  return Buffer.from(text).toString('base64');
}

let appInstance: FastifyInstance | null = null;

export async function getApp(): Promise<FastifyInstance> {
  if (!appInstance) {
    appInstance = await buildApp();
    await appInstance.ready();
  }
  return appInstance;
}

export async function closeApp(): Promise<void> {
  if (appInstance) {
    await appInstance.close();
    appInstance = null;
  }
}
