/**
 * The cookie jar in the Archive. Every biscuit is labelled like a browser
 * session, because the evidence was never meant to be eaten.
 */

export type Cookie = {
  /** Stable id, used to take this one biscuit out of the jar. */
  id: string;
  /** The browser-session name printed on the label. */
  label: string;
  /** The bit the visitor reads when they bite it. */
  note: string;
};

export const EVIDENCE_LINE = 'Please stop eating the evidence.';
export const EMPTY_LINE = 'The jar is empty. The evidence is in you now.';

const JAR: readonly Cookie[] = [
  {
    id: 'session',
    label: 'session_id',
    note: 'Expires when you stop being curious.',
  },
  {
    id: 'auth',
    label: 'auth_token',
    note: 'Tastes like a password reset.',
  },
  {
    id: 'analytics',
    label: '_ga',
    note: 'Counts how many crumbs you drop.',
  },
  {
    id: 'csrf',
    label: 'csrf_token',
    note: 'Suspiciously crunchy, for a security measure.',
  },
  {
    id: 'theme',
    label: 'theme_pref',
    note: 'Dark. Obviously.',
  },
  {
    id: 'cart',
    label: 'cart_id',
    note: 'You never bought anything, so this is free.',
  },
];

/** A fresh jar: the visitor's snacking never changes the contents. */
export function unlockJar(): Cookie[] {
  return JAR.map((cookie) => ({ ...cookie }));
}

export function eatCookie(
  cookies: Cookie[],
  id: string,
): { cookies: Cookie[]; line: string } {
  const cookie = cookies.find((candidate) => candidate.id === id);

  if (!cookie) {
    return {
      cookies: [...cookies],
      line:
        cookies.length === 0
          ? EMPTY_LINE
          : 'That cookie is not in the jar. It is in your heart.',
    };
  }

  const rest = cookies.filter((candidate) => candidate.id !== id);
  if (rest.length === 0) return { cookies: rest, line: EVIDENCE_LINE };

  return { cookies: rest, line: `${cookie.label}: ${cookie.note}` };
}
