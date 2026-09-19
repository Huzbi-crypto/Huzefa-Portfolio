import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projects, getProjectBySlug } from '@/data/projects';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

export default async function ProjectSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Find related projects
  const relatedProjects = projects
    .filter((p) => p.id !== project.id && (p.category === project.category || p.languages.some((l) => project.languages.includes(l))))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-bg text-fg font-sans selection:bg-accent selection:text-bg pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono text-fg-muted">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects Lab</span>
          </Link>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg-subtle">{project.category}</span>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg truncate">{project.slug}</span>
        </div>

        {/* Detailed Artifact View */}
        <ProjectDetail project={project} relatedProjects={relatedProjects} />
      </div>
    </main>
  );
}
