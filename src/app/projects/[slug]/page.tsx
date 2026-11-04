import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import snapshot from '@/data/github-snapshot.json';
import { projects, getProjectBySlug } from '@/data/projects';
import type { ProjectCategory } from '@/types/portfolio';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';
import { PROJECT_ICONS } from '@/components/journal/journalArt';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_NAMES: Record<ProjectCategory, string> = {
  featured: 'Featured',
  'systems-network': 'Systems & networks',
  'ai-ml': 'AI & agents',
  'creative-terminal': 'Creative terminals',
  experiment: 'Experiments',
  archive: 'Archive',
};

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found | Huzbi',
    };
  }

  return {
    title: `${project.title} | Huzbi Projects Lab`,
    description: project.tagline || project.description,
    openGraph: {
      title: `${project.title} | Huzbi Projects Lab`,
      description: project.tagline || project.description,
      type: 'article',
      url: `https://huzefa.vercel.app/projects/${project.slug}/`,
    },
  };
}

/**
 * One project's journal entry: the full notes, the real facts and links.
 * Everything is plain markup so a direct link reads with scripts off.
 */
export default async function ProjectSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = projects
    .filter(
      (candidate) =>
        candidate.id !== project.id &&
        (candidate.category === project.category ||
          candidate.languages.some((language) => project.languages.includes(language))),
    )
    .slice(0, 3);

  const created = project.dateCreated
    ? new Date(`${project.dateCreated}-01T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <JournalPage
      title={project.title}
      lede={project.tagline}
      crumbs={<Link href="/projects/">← The lab directory</Link>}
      art={
        <div className="j-page-art">
          <PixelArt
            grid={PROJECT_ICONS[project.visual.type] ?? PROJECT_ICONS.cartridge}
            scale={7}
            label={project.visual.label}
          />
        </div>
      }
    >
      <div className="j-detail">
        <div className="j-stack">
          <PixelPanel as="section" aria-labelledby="notes-heading">
            <p className="j-kicker">
              {project.visual.asciiBadge} {CATEGORY_NAMES[project.category]}
            </p>
            <h2 id="notes-heading">The short version</h2>
            <p>{project.description}</p>
            {project.highlights?.length ? (
              <>
                <h3>What&apos;s in it</h3>
                <ul className="j-list">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </PixelPanel>

          <PixelPanel as="section" tone="dim" aria-labelledby="stack-heading">
            <h2 id="stack-heading">The stack</h2>
            <div className="j-row">
              {project.techStack.map((tech) => (
                <span className="j-chip" key={tech}>
                  {tech}
                </span>
              ))}
            </div>
            <p className="j-muted">
              Languages: {project.languages.join(', ')}. {project.visual.label}.
            </p>
          </PixelPanel>
        </div>

        <PixelPanel as="aside" tone="note" aria-labelledby="facts-heading">
          <p className="j-kicker">Field notes</p>
          <h2 id="facts-heading">The facts</h2>
          <dl className="j-facts">
            <dt>Category</dt>
            <dd>{CATEGORY_NAMES[project.category]}</dd>
            <dt>Languages</dt>
            <dd>{project.languages.join(', ')}</dd>
            <dt>Stars</dt>
            <dd>
              {project.stars > 0 ? `${project.stars} on GitHub` : 'Waiting for its first star'}
            </dd>
            {project.forks ? (
              <>
                <dt>Forks</dt>
                <dd>{project.forks}</dd>
              </>
            ) : null}
            {created ? (
              <>
                <dt>Started</dt>
                <dd>{created}</dd>
              </>
            ) : null}
          </dl>
          <div className="j-row">
            <a
              href={project.githubUrl}
              className="j-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source on GitHub
            </a>
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                className="j-btn"
                data-kind="ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Live demo
              </a>
            ) : null}
          </div>
        </PixelPanel>
      </div>

      {relatedProjects.length > 0 ? (
        <section className="j-section" aria-labelledby="related-heading">
          <h2 id="related-heading">Elsewhere in the lab</h2>
          <div className="j-grid" data-cols="3">
            {relatedProjects.map((related) => (
              <PixelPanel as="article" key={related.id} tone="dim" className="j-card">
                <div className="j-card-art">
                  <PixelArt
                    grid={PROJECT_ICONS[related.visual.type] ?? PROJECT_ICONS.cartridge}
                    scale={4}
                    label={related.visual.label}
                  />
                </div>
                <div className="j-card-body">
                  <h3>
                    <Link href={`/projects/${related.slug}/`} className="j-card-link">
                      {related.title}
                    </Link>
                  </h3>
                  <p>{related.tagline}</p>
                </div>
              </PixelPanel>
            ))}
          </div>
        </section>
      ) : null}

      <PixelPanel as="section" tone="note" aria-labelledby="back-heading">
        <p className="j-kicker">Keep looking</p>
        <h2 id="back-heading">There are more artifacts on the bench.</h2>
        <p>
          The lab directory lists every project, and the GitHub log holds all{' '}
          {snapshot.repositories.length} public repositories and the year&apos;s lit
          contribution windows.
        </p>
        <div className="j-row">
          <Link href="/projects/" className="j-btn">
            Back to the lab
          </Link>
          <Link href="/github/" className="j-btn" data-kind="ghost">
            The GitHub log
          </Link>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
