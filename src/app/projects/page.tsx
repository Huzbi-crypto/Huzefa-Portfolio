import type { Metadata } from 'next';
import Link from 'next/link';
import { projects } from '@/data/projects';
import type { ProjectCategory } from '@/types/portfolio';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';
import { ICONS, PROJECT_ICONS } from '@/components/journal/journalArt';

export const metadata: Metadata = {
  title: 'Project Lab & Artifacts | Huzbi',
  description:
    'Every artifact from Huzbi’s workshop: routing boards, diffusion machines, agent pipelines, terminals, a software renderer and a compiler.',
};

const CATEGORY_NAMES: Record<ProjectCategory, string> = {
  featured: 'Featured',
  'systems-network': 'Systems & networks',
  'ai-ml': 'AI & agents',
  'creative-terminal': 'Creative terminals',
  experiment: 'Experiments',
  archive: 'Archive',
};

/**
 * The lab directory: every project on one readable page, each with its
 * exhibit card, its languages and a way into the full notes. No filters and
 * no client state, so a direct link reads the same without scripts.
 */
export default function ProjectsPage() {
  const counts = {
    all: projects.length,
    featured: projects.filter((project) => project.featured).length,
    systems: projects.filter((project) => project.category === 'systems-network').length,
    ai: projects.filter((project) => project.category === 'ai-ml').length,
    creative: projects.filter(
      (project) =>
        project.category === 'creative-terminal' || project.category === 'experiment',
    ).length,
  };

  return (
    <JournalPage
      title="Project Lab & Artifacts"
      lede="Tangible objects from Huzbi’s digital workshop: ROM cartridges, terminal consoles, network routing boards, diffusion machines, and agentic workflows."
      art={
        <div className="j-page-art">
          <PixelArt grid={PROJECT_ICONS.network} scale={6} />
          <PixelArt grid={PROJECT_ICONS.cartridge} scale={5} />
        </div>
      }
    >
      <section className="j-section" aria-labelledby="directory-heading">
        <h2 id="directory-heading">The lab directory</h2>
        <PixelPanel tone="dim">
          <div className="j-row">
            <span className="j-chip">{counts.all} artifacts</span>
            <span className="j-chip">{counts.featured} featured</span>
            <span className="j-chip">{counts.systems} systems</span>
            <span className="j-chip">{counts.ai} AI</span>
            <span className="j-chip">{counts.creative} creative</span>
          </div>
          <p className="j-muted">
            Each card is a real project from the lab. Open one for the full notes,
            the source and, where it exists, a live demo. They are also physical
            things to find in the dark part of the room.
          </p>
        </PixelPanel>
      </section>

      <section className="j-section" aria-labelledby="artifacts-heading">
        <h2 id="artifacts-heading">All artifacts</h2>
        <div className="j-grid">
          {projects.map((project) => (
            <PixelPanel as="article" key={project.id} className="j-card">
              <div className="j-card-art">
                <PixelArt
                  grid={PROJECT_ICONS[project.visual.type] ?? PROJECT_ICONS.cartridge}
                  scale={5}
                  label={project.visual.label}
                />
              </div>
              <div className="j-card-body">
                <p className="j-kicker">
                  {project.visual.asciiBadge} {CATEGORY_NAMES[project.category]}
                </p>
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
                  {project.stars > 0 ? (
                    <span className="j-chip">
                      <PixelArt grid={ICONS.star} scale={2} />
                      {project.stars}
                    </span>
                  ) : null}
                </div>
              </div>
            </PixelPanel>
          ))}
        </div>
      </section>

      <PixelPanel as="section" tone="note" aria-labelledby="catalog-heading">
        <p className="j-kicker">The wider archive</p>
        <h2 id="catalog-heading">Looking for the full catalog?</h2>
        <p>
          The GitHub log holds all 38 public repositories, the language
          breakdown, and the year’s contribution wall — every commit window lit.
        </p>
        <div className="j-row">
          <Link href="/github/" className="j-btn">
            Open the GitHub log
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
