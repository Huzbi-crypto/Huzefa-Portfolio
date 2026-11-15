import type { Metadata } from 'next';
import Link from 'next/link';
import { personalInfo } from '@/data/personal';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';

export const metadata: Metadata = {
  title: "Huzbi's room | Developer & Creative Coder",
  description: personalInfo.bio,
};

/**
 * The front page: a journal page with the door to the game beside the plain
 * pages. It is server markup, so it reads the same with scripts off.
 */
export default function HomePage() {
  return (
    <JournalPage
      showBanner={false}
      title="Huzbi's room"
      lede="A portfolio you can walk around, or read like a notebook."
    >
      <PixelPanel as="section" aria-labelledby="play-heading">
        <h2 id="play-heading">The room is open.</h2>
        <p>
          It is 2 AM. Huzbi is not here. The note says he will be back in five minutes, and there
          is a door that should not be there.
        </p>
        <div className="j-row">
          <Link href="/play/" className="j-btn">
            Play the room
          </Link>
          <Link href="/projects/" className="j-btn" data-kind="ghost">
            Read the project notes
          </Link>
        </div>
      </PixelPanel>

      <PixelPanel as="section" aria-labelledby="pages-heading">
        <h2 id="pages-heading">The rest of the notebook</h2>
        <div className="j-row">
          <Link href="/projects/" className="j-btn" data-kind="ghost">
            Projects
          </Link>
          <Link href="/about/" className="j-btn" data-kind="ghost">
            About
          </Link>
          <Link href="/github/" className="j-btn" data-kind="ghost">
            GitHub
          </Link>
          <Link href="/contact/" className="j-btn" data-kind="ghost">
            Contact
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
