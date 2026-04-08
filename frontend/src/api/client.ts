import type { BootstrapPayload, CompanyState, CompanyStateResponse, DomainErrorResponse } from '../types/domain';

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

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE;
}

export function getEventSocketUrl(): string {
  const apiUrl = new URL(getApiBaseUrl());
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  apiUrl.pathname = '/ws/events';
  apiUrl.search = '';
  return apiUrl.toString();
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const body = text.length > 0 ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const errorBody = body as DomainErrorResponse | null;
      throw new ApiError(
        errorBody?.message ?? `Request failed with ${response.status}`,
        response.status,
        errorBody?.code ?? null,
      );
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
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
  const idempotencyKey = crypto.randomUUID();
  await fetchJson('/api/company/bootstrap', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

