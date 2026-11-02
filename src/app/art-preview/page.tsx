import { notFound } from 'next/navigation';
import ArtPreview from './ArtPreview';

export const metadata = { title: 'Art preview', robots: { index: false, follow: false } };

// Dev-only sheet for judging the art by eye. Removed at launch (Phase 2).
export default function ArtPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ArtPreview />;
}
