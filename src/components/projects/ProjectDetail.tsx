'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/portfolio';
import {
  ExternalLink,
  Star,
  Calendar,
  Code2,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Sparkles,
  Cpu,
  Network,
  Database,
  Binary,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons';

interface ProjectDetailProps {
  project: Project;
  relatedProjects?: Project[];
  isModal?: boolean;
}

export function ProjectDetail({ project, relatedProjects = [], isModal = false }: ProjectDetailProps) {
  const [copied, setCopied] = useState(false);
  const accentColor = project.visual.accentColor || '#A8D672';

  const cloneCommand = `git clone ${project.githubUrl}.git`;

  const handleCopyClone = async () => {
    try {
      await navigator.clipboard.writeText(cloneCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. HERO HEADER */}
      <div className="relative p-6 sm:p-8 rounded-xl bg-bg-surface border border-border overflow-hidden">
        {/* Ambient background glow */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded font-mono text-xs font-semibold uppercase tracking-wider border shadow-sm"
                style={{
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                {project.visual.asciiBadge} {project.visual.label}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-bg-deep border border-border text-fg-muted uppercase">
                {project.category}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              {project.dateCreated && (
                <span className="flex items-center gap-1 text-fg-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{project.dateCreated}</span>
                </span>
              )}
              {project.stars > 0 && (
                <span className="flex items-center gap-1 text-accent-secondary font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{project.stars} {project.stars === 1 ? 'star' : 'stars'}</span>
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-fg tracking-tight">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-fg-muted mt-3 font-sans leading-relaxed max-w-3xl">
            {project.tagline}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-border/70">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-deep hover:bg-bg-hover text-fg border border-border hover:border-accent text-xs font-mono transition-all duration-200"
            >
              <GithubIcon className="w-4 h-4 text-accent" />
              <span>View Repository on GitHub</span>
              <ExternalLink className="w-3 h-3 text-fg-muted" />
            </a>

            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-bg font-bold text-xs font-mono transition-all duration-200 shadow-crt"
                style={{ backgroundColor: accentColor }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Live Demo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Git Clone quick copy */}
            <button
              type="button"
              onClick={handleCopyClone}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-deep/80 hover:bg-bg-deep text-fg-muted hover:text-fg border border-border/70 text-xs font-mono transition-colors ml-auto"
              title="Copy git clone command"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span className="text-accent">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>git clone</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN SPECIFICATIONS & DESCRIPTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Description, Highlights, Architectural Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* Project Rationale & Overview */}
          <div className="p-6 rounded-xl bg-bg-surface border border-border space-y-4">
            <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>OVERVIEW // WHY HUZBI BUILT THIS</span>
            </div>
            <p className="text-sm sm:text-base text-fg font-sans leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Key Highlights */}
          {project.highlights && project.highlights.length > 0 && (
            <div className="p-6 rounded-xl bg-bg-surface border border-border space-y-4">
              <div className="flex items-center gap-2 text-accent-secondary font-mono text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>ENGINEERING HIGHLIGHTS &amp; CAPABILITIES</span>
              </div>
              <ul className="space-y-3">
                {project.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-fg font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Terminal / Hardware Specs Sheet */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-border/80 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/70 pb-3 mb-3 text-fg-muted">
              <div className="flex items-center gap-2 text-accent">
                <Binary className="w-3.5 h-3.5" />
                <span>SPECS // {project.slug}.manifest</span>
              </div>
              <span className="text-[10px] text-fg-subtle">STATUS: STABLE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-fg-muted">
              <div>
                <span className="text-fg-subtle block text-[10px] uppercase">Artifact Identifier</span>
                <span className="text-fg font-bold">{project.id}</span>
              </div>
              <div>
                <span className="text-fg-subtle block text-[10px] uppercase">Primary Languages</span>
                <span className="text-fg">{project.languages.join(', ')}</span>
              </div>
              <div>
                <span className="text-fg-subtle block text-[10px] uppercase">Visual Artifact Classification</span>
                <span className="text-fg">{project.visual.label} ({project.visual.type})</span>
              </div>
              <div>
                <span className="text-fg-subtle block text-[10px] uppercase">Repository Location</span>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline truncate block"
                >
                  {project.githubUrl.replace('https://github.com/', '')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tech Stack & System Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tech Stack Matrix */}
          <div className="p-6 rounded-xl bg-bg-surface border border-border space-y-4">
            <div className="flex items-center gap-2 text-accent-tertiary font-mono text-xs uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>TECH STACK &amp; TOOLING</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded bg-bg-deep border border-border text-xs font-mono text-fg"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Hardware Visual Card */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-bg-deep border border-border flex items-center justify-center text-accent">
              <VisualTypeIcon type={project.visual.type} />
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-fg">{project.visual.label}</div>
              <div className="text-xs text-fg-muted font-mono mt-0.5">
                Chassis: {project.visual.type.toUpperCase()}
              </div>
            </div>
            <div className="text-[11px] font-mono text-fg-subtle bg-bg-deep p-2 rounded border border-border/60">
              Interactive lab object in Huzbi&apos;s digital workspace.
            </div>
          </div>
        </div>
      </div>

      {/* 3. RELATED PROJECTS (If provided) */}
      {relatedProjects.length > 0 && (
        <div className="pt-6 border-t border-border/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-mono text-accent">
              <Layers className="w-4 h-4" />
              <span>EXPLORE MORE ARTIFACTS</span>
            </div>
            {!isModal && (
              <Link
                href="/projects"
                className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
              >
                <span>All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedProjects.map((rel) => (
              <Link
                key={rel.id}
                href={`/projects/${rel.slug}`}
                className="p-4 rounded-lg bg-bg-surface border border-border hover:border-accent/60 transition-colors group block"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-accent">{rel.visual.asciiBadge}</span>
                  {rel.stars > 0 && (
                    <span className="text-accent-secondary flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {rel.stars}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-fg group-hover:text-accent transition-colors">
                  {rel.title}
                </h4>
                <p className="text-xs text-fg-muted mt-1 line-clamp-2">{rel.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VisualTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'cartridge':
      return <Binary className="w-6 h-6" />;
    case 'terminal':
      return <Terminal className="w-6 h-6" />;
    case 'network':
      return <Network className="w-6 h-6" />;
    case 'machine':
      return <Sparkles className="w-6 h-6" />;
    case 'module':
      return <Cpu className="w-6 h-6" />;
    default:
      return <Database className="w-6 h-6" />;
  }
}
