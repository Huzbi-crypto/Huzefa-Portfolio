import Link from 'next/link';
import type { Metadata } from 'next';
import GameRoot from '@/components/game/GameRoot';

export const metadata: Metadata = {
  title: "Play Huzbi's room | A small 2 AM game",
  description:
    "Walk around Huzbi's room at 2 AM, find the note, the cold tea and the door that should not be there. Progress saves in your browser.",
};

/**
 * `/play/` is the game. The canvas is decoration; this plain text and these
 * real links are what screen readers and crawlers get.
 */
export default function PlayPage() {
  return (
    <>
      <GameRoot />
      <div className="sr-only">
        <h1>Huzbi&apos;s room</h1>
        <p>
          A small game about a room at 2 AM, a note that says Huzbi will be back in five minutes,
          and a door that should not be there. It needs JavaScript. The same content is also
          available as plain pages.
        </p>
        <nav aria-label="Pages">
          <Link href="/projects/">Projects</Link>
          <Link href="/about/">About</Link>
          <Link href="/github/">GitHub</Link>
          <Link href="/contact/">Contact</Link>
        </nav>
      </div>
      <noscript>
        <p>Huzbi&apos;s room is a small game and needs JavaScript. Projects, About, GitHub and Contact still work as plain pages.</p>
      </noscript>
    </>
  );
}
