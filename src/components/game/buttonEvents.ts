/**
 * Buttons that sit on top of the game own their input: a tap or Enter here
 * must never walk the visitor or use the room behind the button. Native
 * listeners beat the game's own on the stage; React's arrive late.
 */

const TYPES = ['pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup'] as const;

function stopAtTheButton(event: Event): void {
  if (event.type === 'keydown' || event.type === 'keyup') {
    const key = (event as KeyboardEvent).key;
    if (key !== 'Enter' && key !== ' ') return;
  }
  event.stopPropagation();
}

/** Attaches the listeners to the button and returns the matching cleanup. */
export function stopEventsAtButton(button: HTMLElement): () => void {
  for (const type of TYPES) button.addEventListener(type, stopAtTheButton);
  return () => {
    for (const type of TYPES) button.removeEventListener(type, stopAtTheButton);
  };
}
