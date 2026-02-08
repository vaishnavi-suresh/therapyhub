import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './client';

global.fetch = vi.fn();

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET request without token', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response);

    const result = await apiFetch('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('should include Authorization header with token', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await apiFetch('/test', { token: 'test-token' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should handle POST request with body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await apiFetch('/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })
    );
  });

  it('should throw error on failed request', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    } as Response);

    await expect(apiFetch('/test')).rejects.toThrow('Not found');
  });

  it('should handle non-JSON error response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Not JSON');
      },
    } as Response);

    await expect(apiFetch('/test')).rejects.toThrow();
  });
});
