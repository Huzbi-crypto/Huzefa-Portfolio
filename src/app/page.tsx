'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { projects } from '@/data/projects';
import { personalInfo } from '@/data/personal';
import githubSnapshot from '@/data/github-snapshot.json';
import { Room } from '@/components/world/Room';
import { ThemeSelector } from '@/components/world/ThemeSelector';
import {
  Terminal,
  Mail,
  ExternalLink,
  BookOpen,
  Flame,
  Radio,
  Layers,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons';

export default function HomePage() {
  const { openTerminal } = useApp();

  return (
    <div className="relative min-h-screen bg-bg text-fg font-sans selection:bg-accent selection:text-bg pb-24 transition-colors duration-300">
      
      {/* 1. HERO SECTION & CASUAL INTRODUCTION */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-6 sm:pt-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-border/70">
          <div className="space-y-4 max-w-3xl">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-bg-surface border border-border text-accent">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Status: {personalInfo.roomAtmosphere}</span>
            </div>

            {/* Casual Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-fg pb-2 sm:pb-3">
              Hey, I&apos;m{' '}
              <span className="text-accent underline decoration-accent/40 decoration-wavy underline-offset-[8px]">
                {personalInfo.name}
              </span>
              .
            </h1>

            {/* Natural Authentic Bio */}
            <p className="text-lg sm:text-xl text-fg-muted font-sans leading-relaxed pt-2 sm:pt-3">
              {personalInfo.bio}
            </p>

            <p className="text-sm sm:text-base text-fg-muted font-mono leading-relaxed border-l-2 border-accent/50 pl-4">
              &gt; {personalInfo.shortBio}
            </p>

            {/* Quick Navigation Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                href="/projects/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-bg font-mono text-xs font-bold hover:opacity-90 shadow-crt transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Projects Lab</span>
              </Link>

              <Link
                href="/about/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-xs font-mono text-fg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-accent-tertiary" />
                <span>About &amp; Story</span>
              </Link>

              <button
                type="button"
                onClick={openTerminal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-accent/50 text-xs font-mono text-accent transition-colors shadow-crt"
                title="Launch Global CLI Terminal"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>CLI Terminal</span>
              </button>

              <a
                href={personalInfo.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-xs font-mono text-fg transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 text-accent" />
                <span>GitHub ({githubSnapshot.user.login})</span>
              </a>

              <Link
                href="/contact/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-xs font-mono text-fg transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-accent-secondary" />
                <span>Contact</span>
              </Link>
            </div>
          </div>

          {/* Mini Protagonist Avatar Card & Quick Stats */}
          <div className="w-full lg:w-80 bg-bg-surface p-5 rounded-xl border border-border shadow-md font-mono text-xs space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border/80 bg-bg-deep flex-shrink-0">
                <Image
                  src="/assets/cwnilmm1twqb1.jpeg"
                  alt="Huzbi Avatar"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-fg text-sm truncate">{personalInfo.name}</div>
                <div className="text-xs text-accent truncate">@{personalInfo.handle}</div>
                <div className="text-[11px] text-fg-muted truncate">{personalInfo.location}</div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
              <div className="bg-bg-deep p-2 rounded border border-border/40">
                <div className="text-accent font-bold text-sm">{githubSnapshot.stats.totalRepos}</div>
                <div className="text-[10px] text-fg-muted">Repos</div>
              </div>
              <div className="bg-bg-deep p-2 rounded border border-border/40">
                <div className="text-accent-secondary font-bold text-sm">{githubSnapshot.stats.totalStarsGiven}</div>
                <div className="text-[10px] text-fg-muted">Stars</div>
              </div>
              <div className="bg-bg-deep p-2 rounded border border-border/40">
                <div className="text-accent-tertiary font-bold text-sm">2 AM</div>
                <div className="text-[10px] text-fg-muted">Vibe</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THEME SELECTOR & LIVE 3-PALETTE COMPARISON BAR */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-deep/60 p-2.5 rounded-xl border border-border/60">
          <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
            <Compass className="w-3.5 h-3.5 text-accent" />
            <span>Digital Workspace // 02:00 AM Session</span>
          </div>
          <ThemeSelector />
        </div>
      </section>

      {/* 3. HUZBI'S COZY 2 AM DIGITAL ROOM (Centerpiece) */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-6">
        <Room />
      </section>

      {/* 4. FEATURED LAB ARTIFACTS & SYSTEMS */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-16">
        <div className="flex items-center justify-between mb-8 border-b border-border/70 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
              <Layers className="w-6 h-6 text-accent" />
              Featured Lab Artifacts &amp; Systems
            </h2>
            <p className="text-sm font-mono text-fg-muted mt-1">
              Curated hardware cartridges, terminal experiments, and network boards
            </p>
          </div>
          <Link
            href="/projects/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
          >
            <span>Explore all {projects.length} artifacts</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.slice(0, 8).map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between p-5 rounded-xl bg-bg-surface border border-border hover:border-accent/60 transition-all duration-300 hover:shadow-crt group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded font-mono text-xs bg-bg-deep border border-border text-accent">
                    {project.visual.asciiBadge} {project.visual.label}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
                    {project.stars > 0 && (
                      <span className="flex items-center gap-1 text-accent-secondary">
                        <Flame className="w-3.5 h-3.5" />
                        {project.stars}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-fg group-hover:text-accent transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-fg-muted mt-2 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-deep/80 text-fg-muted border border-border/40"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-5 mt-4 border-t border-border/50 text-xs font-mono">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-fg-muted hover:text-accent transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>Source</span>
                </a>
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline ml-auto"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. READING & MEDIA STACK (Manga & Tech Books) */}
      <section className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-16">
        <div className="p-6 rounded-xl bg-bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-accent font-mono text-sm mb-1">
                <BookOpen className="w-4 h-4" />
                <span>SHELF // READING &amp; INSPIRATION</span>
              </div>
              <h2 className="text-xl font-bold text-fg">
                Manga, Books &amp; Creative Fuels
              </h2>
            </div>
            <Link
              href="/about/"
              className="text-xs font-mono text-accent hover:underline hidden sm:inline-flex items-center gap-1"
            >
              <span>Explore full story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {personalInfo.readingList.map((item) => (
              <div
                key={item.title}
                className="p-3 rounded-lg bg-bg-deep border border-border/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="uppercase text-accent-tertiary font-semibold">
                      [{item.type}]
                    </span>
                    <span className="text-fg-muted">{item.status}</span>
                  </div>
                  <div className="text-sm font-semibold text-fg">{item.title}</div>
                  {item.author && (
                    <div className="text-xs text-fg-muted mt-0.5">{item.author}</div>
                  )}
                </div>
                {item.note && (
                  <div className="text-[11px] text-fg-muted/80 mt-2 italic border-t border-border/40 pt-1.5">
                    &ldquo;{item.note}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
