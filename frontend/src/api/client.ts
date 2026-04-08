import type {
  BootstrapPayload,
  CompanyState,
  CompanyStateResponse,
  CreateMessagePayload,
  CreateTaskPayload,
  DomainErrorResponse,
  UpdateAgentPayload,
} from '../types/domain';

const DEFAULT_API_BASE = 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string | null;

  public constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    return DEFAULT_API_BASE;
  }

  const isAbsolute = normalized.startsWith('http://') || normalized.startsWith('https://');
  if (!isAbsolute) {
    const withoutTrailing = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
    const withLeading = withoutTrailing.startsWith('/') ? withoutTrailing : `/${withoutTrailing}`;
    return withLeading === '/' ? '' : withLeading;
  }

  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

export function resolveRequestUrl(path: string): string {
  const base = getApiBaseUrl();
  const shouldStripApiPrefix = /\/api$/i.test(base) && path.startsWith('/api/');
  const normalizedPath = shouldStripApiPrefix ? path.slice('/api'.length) : path;
  if (!base) {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
}

export function getEventSocketUrl(): string {
  const apiBase = getApiBaseUrl();
  const apiUrl = apiBase.startsWith('http://') || apiBase.startsWith('https://')
    ? new URL(apiBase)
    : new URL(apiBase, window.location.origin);
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  apiUrl.pathname = '/ws/events';
  apiUrl.search = '';
  return apiUrl.toString();
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(resolveRequestUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    let body: unknown = null;

    if (text.length > 0) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        const trimmed = text.trimStart();
        const looksLikeHtml = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<');
        const message = looksLikeHtml
          ? `Backend returned HTML instead of JSON for ${path}. Check VITE_API_BASE_URL and make sure backend is running on ${getApiBaseUrl()}.`
          : `Backend returned a non-JSON response for ${path}.`;
        throw new ApiError(message, response.status, null);
      }
    }

    if (!response.ok) {
      const errorBody = body as DomainErrorResponse | null;
      const message = errorBody?.message ?? errorBody?.error ?? `Request failed with ${response.status}`;
      throw new ApiError(
        message,
        response.status,
        errorBody?.code ?? null,
      );
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

function createIdempotencyKey(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return randomUuid;
  }

  return `idemp-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export async function fetchCompanyState(include: string[]): Promise<CompanyState> {
  const includeQuery = include.join(',');
  const response = await fetchJson<CompanyStateResponse>(`/api/company/state?include=${encodeURIComponent(includeQuery)}`, {
    method: 'GET',
  });

  return {
    company: response.company!,
    agents: response.agents ?? [],
    tasks: response.tasks ?? [],
    approvals: response.approvals ?? [],
    recent_events: response.recent_events ?? [],
    runs: response.runs ?? [],
    messages: response.messages ?? [],
    active_run_id: response.active_run_id ?? null,
    recent_run_ids: response.recent_run_ids ?? [],
  };
}

export async function bootstrapCompany(payload: BootstrapPayload): Promise<void> {
  const idempotencyKey = createIdempotencyKey();
  await fetchJson('/api/company/bootstrap', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAgent(agentId: string, payload: UpdateAgentPayload): Promise<void> {
  await fetchJson(`/api/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createTask(payload: CreateTaskPayload): Promise<{ taskId: string; runId: string }> {
  const idempotencyKey = createIdempotencyKey();
  const response = await fetchJson<{ task_id: string; run_id: string }>('/api/tasks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  return {
    taskId: response.task_id,
    runId: response.run_id,
  };
}

export async function postMessage(payload: CreateMessagePayload): Promise<{ messageId: string; runId: string }> {
  const idempotencyKey = createIdempotencyKey();
  const response = await fetchJson<{ message_id: string; run_id: string }>('/api/messages', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      ...payload,
      payload: payload.payload ?? {},
      requires_response: payload.requires_response ?? false,
    }),
  });

  return {
    messageId: response.message_id,
    runId: response.run_id,
  };
}

export async function updateTask(
  taskId: string,
  payload: { status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'; current_phase?: 'intake' | 'planning' | 'execution' | 'review' | 'approval' | 'done' | 'blocked'; summary?: string },
): Promise<void> {
  await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

