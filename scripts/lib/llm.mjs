// Cliente LLM mínimo OpenAI-compatible: sirve para Z.ai/GLM y cualquier
// endpoint estándar de /chat/completions. Cero dependencias: fetch nativo.
// Config por env (o .env en la raíz): LLM_BASE_URL, LLM_API_KEY, LLM_MODEL.
// Uso:
//   import { chatJSON, chatText, llmConfig } from './lib/llm.mjs';
//   const draft = await chatJSON({ system, user, validar: (json) => errorOrNull });

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadDotEnv() {
  const file = join(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

export function llmConfig() {
  loadDotEnv();
  const baseUrl = process.env.LLM_BASE_URL ?? 'https://api.z.ai/api/paas/v4';
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL ?? 'glm-4.6';
  if (!apiKey) {
    throw new Error(
      'Falta LLM_API_KEY (env o .env en la raíz). Copiá .env.example y pegá tu key de Z.ai.',
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey, model };
}

async function chat(messages, { temperature = 0.8, maxTokens = 8192, timeoutMs = 120_000 } = {}) {
  const { baseUrl, apiKey, model } = llmConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`LLM HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('respuesta del LLM vacía o con formato inesperado');
  }
  return content;
}

export async function chatText(options = {}) {
  const { system, user, ...rest } = options;
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  return chat(messages, rest);
}

// Extrae el primer objeto JSON de una respuesta, aunque venga con cercas de
// código o texto alrededor (GLM tiende a saludar antes del JSON).
function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  for (const candidate of [fenced?.[1], text]) {
    if (!candidate) continue;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      /* siguiente candidato */
    }
  }
  throw new Error('la respuesta no contiene un objeto JSON parseable');
}

// Llamada con contrato JSON: `validar(json)` devuelve null si está bien o un
// string con el error; ante error reintenta mostrándoselo al modelo.
export async function chatJSON({
  system,
  user,
  validar,
  retries = 2,
  temperature = 0.8,
  maxTokens = 4096,
} = {}) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const content = await chat(messages, { temperature, maxTokens });
    let parsed;
    try {
      parsed = extractJSON(content);
    } catch (error) {
      lastError = error.message;
    }
    if (parsed !== undefined) {
      const error = validar?.(parsed) ?? null;
      if (error === null) return parsed;
      lastError = error;
    }
    messages.push({ role: 'assistant', content });
    messages.push({
      role: 'user',
      content: `Tu respuesta anterior fue rechazada: ${lastError}. Respondé de nuevo con SOLO el objeto JSON correcto, sin texto alrededor.`,
    });
  }
  throw new Error(`JSON rechazado tras ${retries + 1} intentos: ${lastError}`);
}
