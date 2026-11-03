/**
 * The cookie jar in the Archive. Every biscuit is labelled like a browser
 * session, because the evidence was never meant to be eaten.
 */

import { copy } from '@/game/content/copy';

export type Cookie = {
  /** Stable id, used to take this one biscuit out of the jar. */
  id: string;
  /** The browser-session name printed on the label. */
  label: string;
  /** The bit the visitor reads when they bite it. */
  note: string;
};

export const EVIDENCE_LINE: string = copy.archive.jar.evidence;
export const EMPTY_LINE: string = copy.archive.jar.empty;

const JAR: readonly Cookie[] = copy.archive.jar.cookies;

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
          : copy.archive.jar.missing,
    };
  }

  const rest = cookies.filter((candidate) => candidate.id !== id);
  if (rest.length === 0) return { cookies: rest, line: EVIDENCE_LINE };

  return { cookies: rest, line: `${cookie.label}: ${cookie.note}` };
}
