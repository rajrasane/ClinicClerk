// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
vi.mock('react-hot-toast', () => ({ toast: { success: mocks.success, error: mocks.error } }));
import AddPatientModal from '@/components/AddPatientModalNew';
import { apiCache } from '@/lib/cache';

const sessionFor = (id: string) => ({ data: { session: { user: { id }, access_token: `synthetic-${id}` } }, error: null });

beforeEach(() => {
  vi.clearAllMocks();
  apiCache.clear();
  apiCache.setUser('doctor-a');
  mocks.getSession.mockResolvedValue(sessionFor('doctor-a'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { id: 1 } }) }));
});
afterEach(cleanup);

async function submitSyntheticPatient() {
  for (const [label, value] of [
    ['First Name', 'Synthetic'], ['Last Name', 'Example'], ['Age', '40'],
    ['Phone', '9876543210'], ['Address', 'Synthetic Test Address']
  ]) {
    fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
  }
  fireEvent.change(screen.getByLabelText(/^Gender/), { target: { value: 'Other' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Add Patient' }));
  await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce());
}

describe('add patient account isolation', () => {
  it('preserves normal patient creation and success callbacks', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<AddPatientModal onSuccess={onSuccess} onClose={onClose} />);
    await submitSyntheticPatient();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledOnce();
    const options = vi.mocked(fetch).mock.calls[0][1];
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer synthetic-doctor-a');
    expect(JSON.parse(options?.body as string)).toMatchObject({ first_name: 'Synthetic', last_name: 'Example', gender: 'O' });
  });

  it('does not submit the old form with a new account token from delayed session lookup', async () => {
    let finishSession!: (value: unknown) => void;
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { finishSession = resolve; }));
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<AddPatientModal onSuccess={onSuccess} onClose={onClose} />);
    await submitSyntheticPatient();
    apiCache.setUser('doctor-b');
    await act(async () => { finishSession(sessionFor('doctor-b')); });
    expect(fetch).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it('suppresses a stale success response after logout', async () => {
    let finishBody!: (value: unknown) => void;
    const json = vi.fn(() => new Promise(resolve => { finishBody = resolve; }));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json } as unknown as Response);
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<AddPatientModal onSuccess={onSuccess} onClose={onClose} />);
    await submitSyntheticPatient();
    await waitFor(() => expect(json).toHaveBeenCalledOnce());
    apiCache.setUser(null);
    await act(async () => { finishBody({ success: true, data: { id: 1 } }); });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
});
