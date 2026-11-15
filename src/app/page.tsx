import type { Metadata } from 'next';
import Link from 'next/link';
import { personalInfo } from '@/data/personal';
import { projects } from '@/data/projects';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';
import { SCENE, PROJECT_ICONS } from '@/components/journal/journalArt';
import { journalText } from '@/components/journal/journalText';
import { PlayDoor } from '@/components/home/PlayDoor';
import '@/components/home/home.css';

export const metadata: Metadata = {
  title: "Huzbi's room | Developer & Creative Coder",
  description: personalInfo.bio,
};

/** The three projects shown at the front door, in the order they appear. */
const HOME_PROJECT_IDS = ['routing-sim', 'ai-anime', 'term-exp'] as const;

/**
 * The front door: the room's open door beside the copy, then three real
 * project cards and the way to the rest of the notebook. Server markup with
 * one small client component for the saved star count, so the page reads the
 * same with scripts off.
 */
export default function HomePage() {
  return (
    <JournalPage
      showBanner={false}
      title="Huzbi's room"
      lede={journalText.home.lede}
      art={
        <div className="j-page-art">
          <PixelArt
            grid={SCENE.catSitting}
            scale={5}
            label="The cat, sitting beside a glowing CRT"
          />
          <PixelArt grid={SCENE.crt} scale={6} />
        </div>
      }
    >
      <section className="home-door" aria-labelledby="door-heading">
        <PixelPanel className="home-door-panel">
          <div className="home-door-copy">
            <p className="j-kicker">2:00 AM / the front door</p>
            <h2 id="door-heading">{journalText.home.doorTitle}</h2>
            <p>{journalText.home.doorBody}</p>
            <div className="j-row home-door-actions">
              <PlayDoor />
              <Link href="/projects/" className="j-btn" data-kind="ghost">
                {journalText.home.secondary}
              </Link>
            </div>
          </div>
          <div className="home-door-art">
            <PixelArt
              grid={SCENE.doorOpen}
              scale={8}
              label="An open door with a dark room behind it"
            />
          </div>
        </PixelPanel>
      </section>

      <section className="j-section" aria-labelledby="featured-heading">
        <h2 id="featured-heading">{journalText.home.featuredTitle}</h2>
        <div className="j-grid" data-cols="3">
          {HOME_PROJECT_IDS.map((id) => {
            const project = projects.find((item) => item.id === id);
            if (!project) throw new Error(`missing home project ${id}`);
            return (
              <PixelPanel as="article" key={project.id} className="j-card">
                <div className="j-card-art">
                  <PixelArt
                    grid={PROJECT_ICONS[project.visual.type]}
                    scale={5}
                    label={project.visual.label}
                  />
                </div>
                <div className="j-card-body">
                  <h3>
                    <Link href={`/projects/${project.slug}/`} className="j-card-link">
                      {project.title}
                    </Link>
                  </h3>
                  <p>{project.tagline}</p>
                  <div className="j-row">
                    {project.languages.map((language) => (
                      <span className="j-chip" key={language}>
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </PixelPanel>
            );
          })}
        </div>
        <div className="j-row">
          <Link href="/projects/" className="j-btn" data-kind="ghost">
            {journalText.home.allProjects}
          </Link>
        </div>
      </section>

      <PixelPanel as="section" tone="dim" aria-labelledby="closing-heading">
        <p className="j-kicker">The rest of the notebook</p>
        <h2 id="closing-heading">Plain pages, when you would rather read</h2>
        <div className="j-row">
          <Link href="/about/" className="j-btn" data-kind="ghost">
            {journalText.nav.about}
          </Link>
          <Link href="/github/" className="j-btn" data-kind="ghost">
            {journalText.nav.github}
          </Link>
          <Link href="/contact/" className="j-btn" data-kind="ghost">
            {journalText.nav.contact}
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
