'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { projects } from '@/data/projects';
import type { Project } from '@/types/portfolio';
import { ProjectArtifact } from '@/components/projects/ProjectArtifact';
import { ProjectDetailModal } from '@/components/projects/ProjectDetailModal';
import {
  Layers,
  Search,
  Flame,
  Terminal,
  Cpu,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons';

type FilterCategory = 'all' | 'featured' | 'systems' | 'ai-ml' | 'web-tools';

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Category counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      featured: projects.filter((p) => p.featured).length,
      systems: projects.filter((p) => p.category === 'systems-network').length,
      'ai-ml': projects.filter((p) => p.category === 'ai-ml').length,
      'web-tools': projects.filter(
        (p) => p.category === 'creative-terminal' || p.category === 'experiment'
      ).length,
    };
  }, []);

  // Filter and search logic
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category match
      if (selectedCategory === 'featured' && !project.featured) return false;
      if (selectedCategory === 'systems' && project.category !== 'systems-network') return false;
      if (selectedCategory === 'ai-ml' && project.category !== 'ai-ml') return false;
      if (
        selectedCategory === 'web-tools' &&
        project.category !== 'creative-terminal' &&
        project.category !== 'experiment'
      )
        return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesTagline = project.tagline.toLowerCase().includes(query);
        const matchesDesc = project.description.toLowerCase().includes(query);
        const matchesLang = project.languages.some((l) => l.toLowerCase().includes(query));
        const matchesTech = project.techStack.some((t) => t.toLowerCase().includes(query));

        if (!matchesTitle && !matchesTagline && !matchesDesc && !matchesLang && !matchesTech) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Related projects for modal
  const relatedProjects = useMemo(() => {
    if (!selectedProject) return [];
    return projects
      .filter((p) => p.id !== selectedProject.id && (p.category === selectedProject.category || p.languages.some((l) => selectedProject.languages.includes(l))))
      .slice(0, 3);
  }, [selectedProject]);

  return (
    <main className="min-h-screen bg-bg text-fg font-sans selection:bg-accent selection:text-bg pb-24">
      {/* Page Header */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-8">
        <div className="border-b border-border/70 pb-8">
          <div className="flex items-center gap-2 font-mono text-xs text-accent uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>LAB DIRECTORY // HARDWARE &amp; CODE ARTIFACTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
            Project Lab &amp; Artifacts
          </h1>
          <p className="text-base sm:text-lg text-fg-muted mt-3 max-w-3xl font-sans leading-relaxed">
            Tangible objects from Huzbi&apos;s digital workshop: ROM cartridges, terminal consoles,
            network routing boards, diffusion machines, and agentic workflows.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted border-border hover:text-fg hover:border-accent/40'
                }`}
              >
                All ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('featured')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'featured'
                    ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted border-border hover:text-fg hover:border-accent/40'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-accent-secondary" />
                <span>Featured ({counts.featured})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('systems')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'systems'
                    ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted border-border hover:text-fg hover:border-accent/40'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-accent-tertiary" />
                <span>Systems &amp; Low-level ({counts.systems})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('ai-ml')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'ai-ml'
                    ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted border-border hover:text-fg hover:border-accent/40'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-accent-secondary" />
                <span>AI &amp; ML ({counts['ai-ml']})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('web-tools')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  selectedCategory === 'web-tools'
                    ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                    : 'bg-bg-surface text-fg-muted border-border hover:text-fg hover:border-accent/40'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#73B7FF]" />
                <span>Web &amp; Tools ({counts['web-tools']})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artifacts or language..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-bg-surface border border-border focus:border-accent focus:ring-1 focus:ring-accent text-xs font-mono text-fg placeholder:text-fg-subtle outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-fg-subtle hover:text-fg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Artifacts Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectArtifact
                key={project.id}
                project={project}
                onInspect={(p) => setSelectedProject(p)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl bg-bg-surface border border-dashed border-border/80 my-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-bg-deep border border-border flex items-center justify-center text-accent">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="font-mono text-base font-bold text-fg">
              Nothing here yet.
            </h3>
            <p className="text-sm font-sans text-fg-muted mt-2 max-w-md mx-auto">
              I probably got distracted reading manga or tweaking a compiler. Try searching for something else or clear your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-5 px-4 py-2 rounded-lg bg-bg-deep border border-border hover:border-accent text-xs font-mono text-accent transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Explore All Repositories Callout */}
        <div className="mt-16 p-6 rounded-xl bg-bg-surface border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-fg flex items-center gap-2">
              <GithubIcon className="w-4 h-4 text-accent" />
              <span>Looking for the full catalog?</span>
            </h3>
            <p className="text-xs text-fg-muted mt-1 font-sans">
              Explore all 38 public repositories, language breakdowns, and git stats in the GitHub Hub.
            </p>
          </div>
          <Link
            href="/github"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg font-mono text-xs font-bold shadow-crt hover:opacity-90 transition-opacity"
          >
            <span>Open GitHub Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Detailed Inspection Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        relatedProjects={relatedProjects}
      />
    </main>
  );
}
