import Link from 'next/link';
import type { Metadata } from 'next';
import { JournalPage } from '@/components/journal/JournalPage';
import { SCENE } from '@/components/journal/journalArt';
import { journalText } from '@/components/journal/journalText';
import { PixelArt } from '@/components/journal/PixelArt';
import { PixelPanel } from '@/components/journal/PixelPanel';

export const metadata: Metadata = { title: 'Nothing here | Huzbi' };

export default function NotFound() {
  const { title, lede, toHome, toPlay, toProjects, art } = journalText.notFound;
  return (
    <JournalPage
      title={title}
      lede={lede}
      art={<PixelArt grid={SCENE.doorOpen} scale={6} label={art} />}
    >
      <PixelPanel as="section" aria-label="Where to go instead">
        <div className="j-row">
          <Link href="/" className="j-btn">
            {toHome}
          </Link>
          <Link href="/play/" className="j-btn" data-kind="ghost">
            {toPlay}
          </Link>
          <Link href="/projects/" className="j-btn" data-kind="ghost">
            {toProjects}
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
