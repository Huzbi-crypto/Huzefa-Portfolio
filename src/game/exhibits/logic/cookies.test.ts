import { describe, expect, it } from 'vitest';
import { eatCookie, unlockJar } from './cookies';

describe('cookies', () => {
  it('cookies_have_session_labels', () => {
    const jar = unlockJar();

    expect(jar.length).toBeGreaterThan(3);
    expect(new Set(jar.map((cookie) => cookie.id)).size).toBe(jar.length);
    expect(jar.some((cookie) => cookie.label.includes('session'))).toBe(true);

    for (const cookie of jar) {
      expect(cookie.label).toMatch(/^[a-z_][a-z0-9_-]*$/);
      expect(cookie.id.length).toBeGreaterThan(0);
      expect(cookie.note.length).toBeGreaterThan(0);
    }

    jar.pop();
    expect(unlockJar()).toHaveLength(jar.length + 1);
  });

  it('eating_all_leaves_an_empty_jar_without_error', () => {
    const original = unlockJar();
    let jar = unlockJar();
    let line = '';

    for (const cookie of original) {
      const result = eatCookie(jar, cookie.id);
      jar = result.cookies;
      line = result.line;
      expect(line.length).toBeGreaterThan(0);
    }

    expect(jar).toEqual([]);
    expect(line).toMatch(/evidence/i);

    const again = eatCookie(jar, 'session_id');
    expect(again.cookies).toEqual([]);
    expect(again.line.length).toBeGreaterThan(0);
  });

  it('eating_one_cookie_leaves_the_others_alone', () => {
    const jar = unlockJar();
    const first = jar[0];

    const { cookies, line } = eatCookie(jar, first.id);

    expect(cookies).toHaveLength(jar.length - 1);
    expect(cookies.some((cookie) => cookie.id === first.id)).toBe(false);
    expect(line.length).toBeGreaterThan(0);
    expect(jar).toHaveLength(unlockJar().length);
  });

  it('eating_an_unknown_cookie_is_harmless', () => {
    const jar = unlockJar();
    const { cookies, line } = eatCookie(jar, 'not-a-cookie');

    expect(cookies).toHaveLength(jar.length);
    expect(line.length).toBeGreaterThan(0);
  });
});
