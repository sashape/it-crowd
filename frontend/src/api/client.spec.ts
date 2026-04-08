import { describe, expect, it, vi } from 'vitest';
import { ApiError, fetchCompanyState, normalizeApiBaseUrl } from './client';

describe('api client', () => {
  it('falls back to default base url for empty env value', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('   ')).toBe('http://localhost:8000');
    expect(normalizeApiBaseUrl('http://localhost:8000/')).toBe('http://localhost:8000');
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
