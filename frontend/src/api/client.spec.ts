import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchCompanyState, normalizeApiBaseUrl } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('falls back to default base url for empty env value', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('   ')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('http://localhost:8000/')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('api')).toBe('/api');
    expect(normalizeApiBaseUrl('/api/')).toBe('/api');
  });

  it('does not duplicate /api segment when base already ends with /api', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000/api');
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          company: {
            id: 'company-1',
            name: 'IT-CROWD',
            prompt: 'Prompt',
            language: 'en',
            blueprintStatus: 'blueprint_confirmed',
            createdAt: '2026-04-08T00:00:00.000Z',
          },
          agents: [],
          tasks: [],
          approvals: [],
          recent_events: [],
          runs: [],
          messages: [],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    vi.stubGlobal('fetch', fetchMock);
    await fetchCompanyState(['agents']);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/company/state?include=agents',
      expect.any(Object),
    );
  });

  it('throws readable error when backend returns html instead of json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response('<!DOCTYPE html><html><body>dev server</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }),
    );

    try {
      await fetchCompanyState(['agents']);
      throw new Error('Expected fetchCompanyState to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(200);
      expect((error as Error).message).toContain('Backend returned HTML instead of JSON');
    }
  });
});
