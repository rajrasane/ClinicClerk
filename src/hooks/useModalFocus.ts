'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const modalStack: HTMLElement[] = [];
const focusableSelector = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

// Radix renders popup content outside the modal. Follow only the open controls
// owned by this dialog, rather than admitting every portal on the page.
function focusRoots(dialog: HTMLElement): HTMLElement[] {
  const roots = [dialog];
  for (const root of roots) {
    for (const trigger of root.querySelectorAll('[aria-expanded="true"][aria-controls]')) {
      for (const id of trigger.getAttribute('aria-controls')!.split(/\s+/)) {
        const content = document.getElementById(id);
        if (content && !roots.includes(content) && !roots.some(item => item.contains(content))) {
          roots.push(content);
        }
      }
    }
  }
  return roots;
}

export function useModalFocus(onClose: () => void) {
  const [dialog, setDialog] = useState<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);

  useLayoutEffect(() => {
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let lastFocused: HTMLElement = dialog;
    const popupEscapeEvents = new WeakSet<KeyboardEvent>();
    modalStack.push(dialog);
    const isTopModal = () => modalStack[modalStack.length - 1] === dialog;
    const contains = (element: HTMLElement) => focusRoots(dialog).some(root => root.contains(element));

    const onFocus = (event: FocusEvent) => {
      if (!isTopModal() || !(event.target instanceof HTMLElement)) return;
      // Radix's invisible focus guards are transient sentinels, not background UI.
      if (event.target.hasAttribute('data-radix-focus-guard')) return;
      if (contains(event.target)) {
        lastFocused = event.target;
      } else {
        (lastFocused.isConnected && contains(lastFocused) ? lastFocused : dialog).focus({ preventScroll: true });
      }
    };
    const captureEscape = (event: KeyboardEvent) => {
      // Record this before a popup handles Escape and removes its portal.
      if (isTopModal() && event.key === 'Escape' && focusRoots(dialog).length > 1) {
        popupEscapeEvents.add(event);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal() || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        if (popupEscapeEvents.has(event)) return;
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === 'Tab') {
        const controls = focusRoots(dialog).flatMap(root => Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)))
          .filter((element, index, all) => all.indexOf(element) === index && element.tabIndex >= 0
            && !element.matches(':disabled') && !element.closest('[hidden], [inert], [aria-hidden="true"]')
            && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
        const current = controls.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? (current <= 0 ? controls.length - 1 : current - 1)
          : (current + 1) % controls.length;
        event.preventDefault();
        (controls[next] || dialog).focus();
      }
    };

    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', captureEscape, true);
    document.addEventListener('keydown', onKeyDown);
    dialog.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', captureEscape, true);
      document.removeEventListener('keydown', onKeyDown);
      const wasTop = isTopModal();
      modalStack.splice(modalStack.indexOf(dialog), 1);
      if (wasTop && trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [dialog]);

  return setDialog;
}
