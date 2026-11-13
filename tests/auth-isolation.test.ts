// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(),
  single: vi.fn(), from: vi.fn(), clearAuthStorage: vi.fn()
}));
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange, signOut: mocks.signOut }, from: mocks.from },
  clearAuthStorage: mocks.clearAuthStorage
}));
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { usePatients } from '@/hooks/usePatients';
import { useVisits } from '@/hooks/useVisits';
import { apiCache } from '@/lib/cache';

const sessionFor = (id: string) => ({ user: { id }, access_token: `synthetic-${id}` }) as Session;
let session: Session | null;
let emit: (event: string, session: Session | null) => void;
const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(AuthProvider, null, children);
const response = (name: string) => ({ ok: true, json: async () => ({ success: true, data: [{ id: 1, name }], pagination: { page: 1 } }) }) as Response;
const changeSession = async (next: Session | null) => {
  session = next;
  await act(async () => { emit(next ? 'SIGNED_IN' : 'SIGNED_OUT', next); });
};

beforeEach(() => {
  vi.clearAllMocks();
  apiCache.setUser(null);
  apiCache.clear();
  session = sessionFor('doctor-a');
  mocks.getSession.mockImplementation(async () => ({ data: { session }, error: null }));
  mocks.onAuthStateChange.mockImplementation(callback => {
    emit = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocks.single.mockImplementation(async () => ({ data: { id: session?.user.id, first_name: 'Synthetic' }, error: null }));
  mocks.from.mockImplementation(() => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }));
  mocks.signOut.mockResolvedValue({ error: null });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('Synthetic A')));
});
afterEach(cleanup);

describe('authentication transitions', () => {
  it('clears cached records on external SIGNED_OUT and hides the doctor', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.doctor?.id).toBe('doctor-a'));
    apiCache.set('/api/patients', { success: true, data: ['Synthetic A'] });
    await changeSession(null);
    expect(result.current.user).toBeNull();
    expect(result.current.doctor).toBeNull();
    expect(apiCache.get('/api/patients')).toBeNull();
    expect(apiCache.snapshot().userId).toBeNull();
  });

  it('does not apply an old profile result after switching accounts', async () => {
    let finishA!: (value: unknown) => void;
    mocks.single.mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mocks.single).toHaveBeenCalledOnce());
    await changeSession(sessionFor('doctor-b'));
    await waitFor(() => expect(result.current.doctor?.id).toBe('doctor-b'));
    await act(async () => { finishA({ data: { id: 'doctor-a', first_name: 'Synthetic A' }, error: null }); });
    expect(result.current.doctor?.id).toBe('doctor-b');
  });

  it('does not restore an initial session that resolves after sign-out', async () => {
    let finishInitial!: (value: unknown) => void;
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { finishInitial = resolve; }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.signOut(); });
    await act(async () => { finishInitial({ data: { session: sessionFor('doctor-a') }, error: null }); });
    expect(result.current.user).toBeNull();
    expect(apiCache.snapshot().userId).toBeNull();
  });
});

for (const kind of ['patients', 'visits'] as const) {
  describe(`${kind} hook`, () => {
    const useRecords: () => { records: { id: number }[]; refetch: () => Promise<void> } = kind === 'patients' ? () => {
      const patients = usePatients();
      return { records: patients.patients, refetch: patients.refetch };
    } : () => {
      const visits = useVisits();
      return { records: visits.visits, refetch: visits.refetch };
    };

    it('hides the previous account records during a session switch', async () => {
      const { result } = renderHook(useRecords, { wrapper });
      await waitFor(() => expect(result.current.records).toHaveLength(1));
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
      await changeSession(sessionFor('doctor-b'));
      expect(result.current.records).toEqual([]);
      await changeSession(null);
      expect(result.current.records).toEqual([]);
    });

    it('discards a delayed response from the account that signed out', async () => {
      const finishes: Array<(value: Response) => void> = [];
      vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finishes.push(resolve); }));
      const { result } = renderHook(useRecords, { wrapper });
      await waitFor(() => expect(finishes).toHaveLength(1));
      await changeSession(null);
      await act(async () => { finishes.forEach(finish => finish(response('Synthetic old record'))); });
      expect(result.current.records).toEqual([]);
      expect(apiCache.get(`/api/${kind}?page=1&limit=${kind === 'patients' ? 10 : 5}`)).toBeNull();
    });
  });
}
