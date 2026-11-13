import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
const request = (authorization?: string) => new Request('https://synthetic.invalid/api/patients', { headers: authorization ? { authorization } : {} }) as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.invalid');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-public-key');
  mocks.createClient.mockImplementation(() => ({ auth: { getUser: mocks.getUser } }));
});

describe('stateless API authentication', () => {
  it('rejects missing and malformed bearer authentication without a cookie fallback', async () => {
    for (const header of [undefined, 'Basic synthetic', 'Bearer ', 'Bearer one two']) {
      expect(await getAuthenticatedUser(request(header))).toBeNull();
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('validates the bearer with Supabase and disables server session persistence', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'doctor-a' } }, error: null });
    expect(await getAuthenticatedUser(request('Bearer synthetic-a'))).toEqual({ id: 'doctor-a' });
    expect(mocks.getUser).toHaveBeenCalledWith('synthetic-a');
    expect(mocks.createClient).toHaveBeenCalledWith('https://synthetic.invalid', 'synthetic-public-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: 'Bearer synthetic-a' } }
    });
    const first = createSupabaseServerClient(request('Bearer synthetic-a'));
    const second = createSupabaseServerClient(request('Bearer synthetic-b'));
    expect(first).not.toBe(second);
  });

  it('fails closed for invalid tokens and unavailable auth verification', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { code: 'user_not_found' } });
    expect(await getAuthenticatedUser(request('Bearer synthetic-a'))).toBeNull();
    mocks.getUser.mockRejectedValueOnce(new Error('Synthetic network failure'));
    expect(await getAuthenticatedUser(request('Bearer synthetic-a'))).toBeNull();
  });
});
