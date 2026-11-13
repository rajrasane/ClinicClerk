// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic-project.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-public-key');
});

it('clears only the current project auth storage', async () => {
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem('sb-synthetic-project-auth-token', 'synthetic-token');
    storage.setItem('sb-synthetic-project-auth-token-code-verifier', 'synthetic-verifier');
    storage.setItem('sb-other-project-auth-token', 'unrelated-token');
    storage.setItem('unrelated-preference', 'keep');
  }
  const { clearAuthStorage } = await import('@/lib/supabase');
  clearAuthStorage();
  for (const storage of [localStorage, sessionStorage]) {
    expect(storage.getItem('sb-synthetic-project-auth-token')).toBeNull();
    expect(storage.getItem('sb-synthetic-project-auth-token-code-verifier')).toBeNull();
    expect(storage.getItem('sb-other-project-auth-token')).toBe('unrelated-token');
    expect(storage.getItem('unrelated-preference')).toBe('keep');
  }
});

it('does not throw when browser storage is blocked', async () => {
  const { clearAuthStorage } = await import('@/lib/supabase');
  const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Blocked'); });
  expect(clearAuthStorage).not.toThrow();
  spy.mockRestore();
});

it('lets Supabase handle token refresh instead of clearing sessions on network failure', async () => {
  await import('@/lib/supabase');
  const config = mocks.createClient.mock.calls[0][2];
  expect(config.auth).toMatchObject({ autoRefreshToken: true, persistSession: true, storageKey: 'sb-synthetic-project-auth-token' });
  expect(config.global).toBeUndefined();
});
