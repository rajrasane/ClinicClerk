// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: { current: {} as Record<string, unknown> }, replace: vi.fn(), getSession: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth.current }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, push: vi.fn(), back: vi.fn() }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
vi.mock('framer-motion', () => ({
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
  useReducedMotion: () => true
}));
vi.mock('@/sections/Header', () => ({ Header: () => <div>Header</div> }));
vi.mock('@/app/landing/page', () => ({ default: () => <div>Public landing</div> }));
vi.mock('@/components/Patients', () => ({ default: function SyntheticPatients() {
  const [selected, setSelected] = useState<string | null>(null);
  return <div><button onClick={() => setSelected('Synthetic patient A detail')}>Open detail</button>{selected && <div>{selected}</div>}</div>;
} }));
vi.mock('@/components/Visits', () => ({ default: () => <div>Visits</div> }));

import { apiCache } from '@/lib/cache';
import Home from '@/app/page';
import ProfilePage from '@/app/profile/page';

function account(id: string, name: string) {
  return {
    user: { id }, loading: false, doctorLoading: false,
    doctor: { id, first_name: name, last_name: 'Synthetic', email: `${id}@example.invalid` },
    signOut: vi.fn(), refreshDoctorData: vi.fn()
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.current = account('doctor-a', 'Synthetic A');
  apiCache.setUser('doctor-a');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(cleanup);

describe('account-specific page state', () => {
  it('unmounts open clinical detail state on a direct account switch', () => {
    const view = render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Open detail' }));
    expect(screen.queryByText('Synthetic patient A detail')).not.toBeNull();
    mocks.auth.current = account('doctor-b', 'Synthetic B');
    view.rerender(<Home />);
    expect(screen.queryByText('Synthetic patient A detail')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open detail' })).not.toBeNull();
  });

  it('discards profile drafts and shows only the next account profile', () => {
    const view = render(<ProfilePage />);
    const input = screen.getByDisplayValue('Synthetic A');
    fireEvent.change(input, { target: { value: 'Unsaved A draft' } });
    expect(screen.queryByDisplayValue('Unsaved A draft')).not.toBeNull();
    mocks.auth.current = account('doctor-b', 'Synthetic B');
    view.rerender(<ProfilePage />);
    expect(screen.queryByDisplayValue('Unsaved A draft')).toBeNull();
    expect(screen.queryByDisplayValue('Synthetic B')).not.toBeNull();
    expect(screen.queryByDisplayValue('doctor-a@example.invalid')).toBeNull();
  });

  it('hides the profile immediately after logout and redirects to login', () => {
    const view = render(<ProfilePage />);
    expect(screen.queryByDisplayValue('Synthetic A')).not.toBeNull();
    mocks.auth.current = { user: null, doctor: null, loading: false };
    view.rerender(<ProfilePage />);
    expect(screen.queryByDisplayValue('Synthetic A')).toBeNull();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/login');
  });

  it('does not show profile state or redirect while authentication initializes', () => {
    mocks.auth.current = { user: null, doctor: null, loading: true };
    render(<ProfilePage />);
    expect(screen.queryByRole('status')).not.toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not submit a previous account draft after session lookup switches accounts', async () => {
    let finish!: (value: unknown) => void;
    mocks.getSession.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<ProfilePage />);
    fireEvent.change(screen.getByDisplayValue('Synthetic A'), { target: { value: 'Unsaved A draft' } });
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0]);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce());
    apiCache.setUser('doctor-b');
    mocks.auth.current = account('doctor-b', 'Synthetic B');
    view.rerender(<ProfilePage />);
    await act(async () => { finish({ data: { session: { user: { id: 'doctor-b' }, access_token: 'synthetic-b' } } }); });
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Synthetic B')).not.toBeNull();
  });


  it('does not sign out a new account when an earlier deletion response arrives', async () => {
    const signOut = mocks.auth.current.signOut;
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'doctor-a' }, access_token: 'synthetic-a' } } });
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    apiCache.setUser('doctor-b');
    mocks.auth.current = account('doctor-b', 'Synthetic B');
    view.rerender(<ProfilePage />);
    await act(async () => { finish({ ok: true } as Response); });
    expect(signOut).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Synthetic B')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Yes, Delete' })).toBeNull();
  });

});
