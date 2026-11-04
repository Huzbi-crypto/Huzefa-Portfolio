'use client';

import { useEffect, type RefObject } from 'react';

/** The world owns the keyboard whenever no panel needs it. */
export function focusGameStage(): void {
  document.querySelector<HTMLElement>('.game-stage')?.focus({ preventScroll: true });
}

/**
 * One focus rule for every game modal: put focus on the first control, keep
 * Tab inside the panel, and hand the keyboard back to the stage on close. The
 * stage's key listener is what makes walking work, so returning to `body` is
 * not good enough.
 */
export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  initialRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    (initialRef?.current ?? panel)?.focus?.({ preventScroll: true });

    const keepIn = (event: FocusEvent): void => {
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        (initialRef?.current ?? panel)?.focus?.({ preventScroll: true });
      }
    };
    document.addEventListener('focusin', keepIn);

    return () => {
      document.removeEventListener('focusin', keepIn);
      focusGameStage();
    };
  }, [open, panelRef, initialRef]);
}
