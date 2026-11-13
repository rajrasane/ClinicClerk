import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCache, cachedFetch, authenticatedJsonFetch } from '@/lib/cache';

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth } }));

const sessionFor = (id: string) => ({ data: { session: { user: { id }, access_token: `synthetic-${id}` } }, error: null });
const response = (name: string) => ({ ok: true, json: async () => ({ success: true, data: [{ name }] }) });

beforeEach(() => {
  vi.clearAllMocks();
  apiCache.setUser(null);
  apiCache.clear();
  vi.stubGlobal('fetch', vi.fn());
});

describe('authenticated response cache', () => {
  it('requires authentication before reading an otherwise cached URL', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    vi.mocked(fetch).mockResolvedValue(response('Synthetic A') as Response);
    await cachedFetch('/api/patients');
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(cachedFetch('/api/patients')).rejects.toThrow('Authentication required');
  });

  it('never returns one account’s cached records to another account', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    vi.mocked(fetch).mockResolvedValue(response('Synthetic A') as Response);
    await cachedFetch('/api/patients');
    apiCache.setUser('doctor-b');
    auth.getSession.mockResolvedValue(sessionFor('doctor-b'));
    vi.mocked(fetch).mockResolvedValue(response('Synthetic B') as Response);
    expect((await cachedFetch('/api/patients')).data[0].name).toBe('Synthetic B');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects a response that finishes after logout and does not refill the cache', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = cachedFetch('/api/visits');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    apiCache.setUser(null);
    finish(response('Synthetic A') as Response);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    apiCache.setUser('doctor-a');
    expect(apiCache.get('/api/visits')).toBeNull();
  });

  it('rejects an in-flight request invalidated by a mutation', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = cachedFetch('/api/patients');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    apiCache.invalidate('/api/patients');
    finish(response('Deleted synthetic record') as Response);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(apiCache.get('/api/patients')).toBeNull();
  });

  it('passes cancellation, forces refresh, and prevents browser caching', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    vi.mocked(fetch).mockResolvedValue(response('Synthetic A') as Response);
    const controller = new AbortController();
    await cachedFetch('/api/patients', { signal: controller.signal });
    await cachedFetch('/api/patients');
    expect(fetch).toHaveBeenCalledOnce();
    await cachedFetch('/api/patients', { signal: controller.signal }, 5, true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ signal: controller.signal, cache: 'no-store' });
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer synthetic-doctor-a');
    controller.abort();
    await expect(cachedFetch('/api/patients', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});


describe('authenticated JSON operations', () => {
  it('never submits an old form under a newly resolved account', async () => {
    apiCache.setUser('doctor-a');
    let finishSession!: (value: unknown) => void;
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { finishSession = resolve; }));
    const pending = authenticatedJsonFetch('/api/patients', { method: 'POST', body: '{"first_name":"Synthetic A"}' });
    await vi.waitFor(() => expect(auth.getSession).toHaveBeenCalledOnce());
    apiCache.setUser('doctor-b');
    finishSession(sessionFor('doctor-b'));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects mismatched session identities even before auth context updates', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-b'));
    await expect(authenticatedJsonFetch('/api/patients', { method: 'POST' })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('discards mutation results that finish reading after logout', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    let finishBody!: (value: unknown) => void;
    const json = vi.fn(() => new Promise(resolve => { finishBody = resolve; }));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json } as unknown as Response);
    const pending = authenticatedJsonFetch('/api/patients/1', { method: 'PUT' });
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    apiCache.setUser(null);
    finishBody({ success: true });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('keeps one owner across a create-patient then create-visit operation', async () => {
    apiCache.setUser('doctor-a');
    auth.getSession.mockResolvedValue(sessionFor('doctor-a'));
    vi.mocked(fetch).mockResolvedValue(response('Synthetic A') as Response);
    const operation = apiCache.snapshot();
    const first = await authenticatedJsonFetch('/api/patients', { method: 'POST', body: '{"first_name":"Synthetic A"}' }, operation);
    expect(first.response.ok).toBe(true);
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer synthetic-doctor-a');
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'POST', cache: 'no-store', body: '{"first_name":"Synthetic A"}' });
    apiCache.setUser('doctor-b');
    auth.getSession.mockResolvedValue(sessionFor('doctor-b'));
    await expect(authenticatedJsonFetch('/api/visits', { method: 'POST' }, operation)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
