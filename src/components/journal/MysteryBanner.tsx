import Link from 'next/link';
import { ICONS } from './journalArt';
import { journalText } from './journalText';
import { PixelArt } from './PixelArt';

/**
 * One quiet line under the navigation: someone who followed a link to read
 * can ignore it, and someone curious can walk through the door.
 */
export function MysteryBanner() {
  const { lead, link, note } = journalText.banner;
  return (
    <aside className="mystery-banner" aria-label={note}>
      <div className="j-wrap mystery-banner-row">
        <PixelArt grid={ICONS.door} scale={3} className="mystery-door" />
        <p className="mystery-banner-text">
          {lead}{' '}
          <Link href="/" className="mystery-banner-link">
            {link}
          </Link>
        </p>
      </div>
    </aside>
  );
}
