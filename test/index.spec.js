import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('User System Worker', () => {
  it('should return 404 for unknown routes', async () => {
    const request = new Request('http://example.com/unknown-route', { method: 'GET' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Not found');
  });

  it('should return 404 for unknown API routes (integration style)', async () => {
    const response = await SELF.fetch('http://example.com/api/unknown');
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Not found');
  });
});
