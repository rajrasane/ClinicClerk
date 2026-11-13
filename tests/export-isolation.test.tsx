// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { id: 'doctor-a' } as { id: string } | null,
  getSession: vi.fn(), success: vi.fn(), error: vi.fn()
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
vi.mock('react-hot-toast', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/components/ui/dropdown-menu', () => {
  const Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return {
    DropdownMenu: Container, DropdownMenuContent: Container, DropdownMenuLabel: Container,
    DropdownMenuTrigger: Container, DropdownMenuSeparator: () => null,
    DropdownMenuItem: ({ children, onClick, disabled }: React.ComponentProps<'button'>) => <button onClick={onClick} disabled={disabled}>{children}</button>
  };
});
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { apiCache } from '@/lib/cache';

const syntheticResponse = (blob = async () => new Blob(['synthetic export'])) => ({
  ok: true, headers: new Headers({ 'Content-Disposition': 'attachment; filename="synthetic.xlsx"' }), blob
}) as Response;
let createObjectURL: ReturnType<typeof vi.fn>;
let click: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'doctor-a' };
  apiCache.clear();
  apiCache.setUser('doctor-a');
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'doctor-a' }, access_token: 'synthetic-a' } } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(syntheticResponse()));
  createObjectURL = vi.fn().mockReturnValue('blob:synthetic-export');
  Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: createObjectURL });
  Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(cleanup);

const startExport = () => fireEvent.click(screen.getByRole('button', { name: 'Download as Excel' }));

describe('export account isolation', () => {
  it('downloads a completed export for the current account', async () => {
    render(<ExportDropdown type="patients" filters={{ search: 'Synthetic' }} />);
    startExport();
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('/api/export/patients?format=excel&search=Synthetic', expect.objectContaining({
      cache: 'no-store', signal: expect.any(AbortSignal), headers: { Authorization: 'Bearer synthetic-a' }
    }));
  });

  for (const nextOwner of [null, 'doctor-b']) {
    it(`discards a completed export body after ${nextOwner ? 'an account switch' : 'logout'}`, async () => {
      let finishBody!: (value: Blob) => void;
      const blob = vi.fn(() => new Promise<Blob>(resolve => { finishBody = resolve; }));
      vi.mocked(fetch).mockResolvedValue(syntheticResponse(blob));
      const { rerender } = render(<ExportDropdown type="patients" />);
      startExport();
      await waitFor(() => expect(blob).toHaveBeenCalledOnce());
      const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
      apiCache.setUser(nextOwner);
      mocks.user = nextOwner ? { id: nextOwner } : null;
      rerender(<ExportDropdown type="patients" />);
      expect(signal?.aborted).toBe(true);
      await act(async () => { finishBody(new Blob(['synthetic old account export'])); });
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(click).not.toHaveBeenCalled();
      expect(mocks.success).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
    });
  }

  it('checks the account generation before fetching after delayed session lookup', async () => {
    let finishSession!: (value: unknown) => void;
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { finishSession = resolve; }));
    render(<ExportDropdown type="visits" />);
    startExport();
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce());
    // Auth state changes synchronously before React has rerendered the component.
    apiCache.setUser('doctor-b');
    await act(async () => { finishSession({ data: { session: { user: { id: 'doctor-a' }, access_token: 'synthetic-a' } } }); });
    expect(fetch).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('cancels and discards exports after unmount even if fetch ignores cancellation', async () => {
    let finishResponse!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finishResponse = resolve; }));
    const { unmount } = render(<ExportDropdown type="visits" />);
    startExport();
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => { finishResponse(syntheticResponse()); });
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });
});
