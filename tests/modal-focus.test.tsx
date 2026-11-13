// @vitest-environment jsdom
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalFocus } from '@/hooks/useModalFocus';

function Modal({ onClose }: { onClose: () => void }) {
  const ref = useModalFocus(onClose);
  const [popup, setPopup] = useState(false);
  return <div ref={ref} role="dialog" aria-label="Test modal" tabIndex={-1}>
    <button aria-controls="calendar-popup" aria-expanded={popup} onClick={() => setPopup(true)}>Calendar</button>
    <button disabled>Disabled</button>
    <button hidden>Hidden</button>
    <button onClick={onClose}>Close</button>
    {popup && createPortal(<div id="calendar-popup" role="dialog" aria-label="Calendar popup"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setPopup(false);
        }
      }}><button>Day</button></div>, document.body)}
  </div>;
}

function Harness() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open</button><button>Background</button>
    {open && <Modal onClose={() => setOpen(false)} />}</>;
}

function openModal() {
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Open' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

beforeEach(() => {
  // jsdom has no layout; make visible controls measurable for the focus helper.
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
});
afterEach(cleanup);

describe('modal keyboard focus', () => {
  it('wraps both tab directions, skips hidden/disabled controls and restores the trigger', () => {
    const trigger = openModal();
    const modal = screen.getByRole('dialog', { name: 'Test modal' });
    const first = screen.getByRole('button', { name: 'Calendar' });
    const last = screen.getByRole('button', { name: 'Close' });
    expect(document.activeElement).toBe(modal);
    fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab' });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    screen.getByRole('button', { name: 'Background' }).focus();
    expect(document.activeElement).not.toBe(trigger);
  });

  it('keeps outside focus out, admits an owned portal, and lets it consume Escape', () => {
    openModal();
    const first = screen.getByRole('button', { name: 'Calendar' });
    first.focus();
    screen.getByRole('button', { name: 'Background' }).focus();
    expect(document.activeElement).toBe(first);
    fireEvent.click(first);
    const day = screen.getByRole('button', { name: 'Day' });
    day.focus();
    expect(document.activeElement).toBe(day);
    fireEvent.keyDown(day, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Calendar popup' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Test modal' })).toBeTruthy();
    fireEvent.keyDown(first, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }));
  });

  it('restores focus on the visible close action as well as Escape', () => {
    const trigger = openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.activeElement).toBe(trigger);
  });
});
