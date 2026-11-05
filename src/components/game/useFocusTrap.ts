'use client';

import { useEffect, type RefObject } from 'react';

/** The world owns the keyboard whenever no panel needs it. */
export function focusGameStage(): void {
  document.querySelector<HTMLElement>('.game-stage')?.focus({ preventScroll: true });
}

/** Everything a visitor can reach with Tab, in document order. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * Visible here means "rendered", not "on screen": an off-screen element is
 * still reachable, while one under `display:none` or `hidden` is not.
 */
function isVisible(element: HTMLElement): boolean {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (node.hidden || node.hasAttribute('inert')) return false;
    const style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return false;
    }
  }
  return true;
}

/** The panel's own tab ring: real controls, in the order the DOM gives them. */
function focusableWithin(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-disabled') !== 'true' &&
      isVisible(element),
  );
}

/**
 * One focus rule for every game modal: put focus on the first control, keep
 * Tab inside the panel, and hand the keyboard back to the stage on close. The
 * stage's key listener is what makes walking work, so returning to `body` is
 * not good enough.
 *
 * Tab is handled on keydown, before the browser moves focus, so a panel can
 * never briefly lose it under load. The `focusin` listener stays as a net for
 * focus moved by script or by a stray pointer.
 *
 * `restoreRef` is for a modal that belongs to a visible control (the journal
 * button); without it focus goes back to the game stage.
 */
export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  initialRef?: RefObject<HTMLElement | null>,
  restoreRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    const focusInitial = (): void => {
      (initialRef?.current ?? panelRef.current)?.focus?.({ preventScroll: true });
    };

    focusInitial();

    const keepIn = (event: FocusEvent): void => {
      const panel = panelRef.current;
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        focusInitial();
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = focusableWithin(panel);
      if (items.length === 0) {
        // Nothing tabbable: keep the panel itself, rather than the page.
        event.preventDefault();
        focusInitial();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const index = active instanceof HTMLElement ? items.indexOf(active) : -1;

      // Focus starts on the panel itself (tabIndex -1), so there is no index;
      // wrap to the near end instead of letting the browser leave the panel.
      if (index === -1) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && index === 0) {
        event.preventDefault();
        last.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('focusin', keepIn);
    // Capture, so a stopPropagation in the panel cannot let Tab escape.
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('focusin', keepIn);
      document.removeEventListener('keydown', onKeyDown, true);
      const restore = restoreRef?.current;
      if (restore) restore.focus({ preventScroll: true });
      else focusGameStage();
    };
  }, [open, panelRef, initialRef, restoreRef]);
}
