'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { personalInfo } from '@/data/personal';
import {
  Terminal,
  BookOpen,
  Cpu,
  Network,
  Code2,
  Compass,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Layers,
  ArrowRight,
  Coffee,
  Heart,
  Radio,
} from 'lucide-react';

export default function AboutPage() {
  const { openTerminal } = useApp();

  return (
    <div className="min-h-screen bg-bg text-fg font-sans pb-24 transition-colors duration-200">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-8 sm:pt-12 space-y-12">
        {/* Navigation Breadcrumb / Section Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-accent">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-fg-muted">workspace</span>
            <span className="text-fg-subtle">/</span>
            <span className="font-semibold text-accent">about_huzbi.md</span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
            <span className="hidden sm:inline">2:00 AM Digital Room</span>
          </div>
        </div>

        {/* Hero / Identity Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Avatar and Visual Badge */}
          <div className="md:col-span-4 order-2 md:order-1">
            <div className="p-4 rounded-xl bg-bg-surface border border-border shadow-crt relative group">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-fg-muted border-b border-border/60 pb-2">
                <span className="text-accent flex items-center gap-1">
                  <Radio className="w-3 h-3 text-accent animate-pulse" />
                  AVATAR_TTY
                </span>
                <span className="text-fg-subtle">ID: HUZBI</span>
              </div>

              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border bg-bg-deep mb-3">
                <Image
                  src="/assets/cwnilmm1twqb1.jpeg"
                  alt="Huzbi Midjourney Avatar Artwork"
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-bg/90 backdrop-blur-sm border border-border text-[10px] font-mono text-accent">
                  PROTAGONIST_ART
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs text-fg-muted pt-1">
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Legal Name:</span>
                  <span className="text-fg font-medium">{personalInfo.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Net Handle:</span>
                  <span className="text-accent font-semibold">@{personalInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">University:</span>
                  <span className="text-fg">FAST NU Karachi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">Atmosphere:</span>
                  <span className="text-accent-secondary">CRT Glow &amp; Tea</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-center">
                <button
                  type="button"
                  onClick={openTerminal}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-bg-deep hover:bg-accent/15 border border-border hover:border-accent text-accent font-mono text-xs transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Launch huzbi@room CLI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Story & Bio */}
          <div className="md:col-span-8 order-1 md:order-2 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-bg-surface border border-border text-accent mb-3">
                <Coffee className="w-3.5 h-3.5" />
                <span>FAST NU Computer Science Graduate &amp; Developer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
                Hey. I&apos;m Huzefa, but most people online know me as{' '}
                <span className="text-accent underline decoration-accent/40 decoration-wavy underline-offset-8">
                  Huzbi
                </span>
                .
              </h1>
            </div>

            <p className="text-base sm:text-lg text-fg-muted font-sans leading-relaxed">
              I graduated with a Bachelor&apos;s in Computer Science from{' '}
              <span className="text-fg font-semibold">FAST National University (NUCES)</span> in Karachi.
              When I&apos;m not working, I build random experiments that occasionally get a little out of hand—spanning low-level systems and packet routing to modern multi-agent AI loops and retro creative coding.
            </p>

            {/* Philosophy Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-bg-surface/80 border border-accent/40 shadow-crt space-y-2">
              <div className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-accent" />
                The &ldquo;Lazy Dude&rdquo; Philosophy
              </div>
              <p className="text-sm font-mono text-accent-cream leading-relaxed">
                &ldquo;Write clean, deliberate code so you don&apos;t have to fix bugs on weekends.&rdquo;
              </p>
              <p className="text-xs text-fg-muted leading-relaxed font-sans pt-1">
                I don&apos;t sound like a corporate LinkedIn robot because I genuinely care about how things work underneath. I don&apos;t care about buzzwords like &ldquo;synergistic end-to-end paradigm accelerators.&rdquo; I care about memory layouts, cache behavior, clean abstraction boundaries, and having enough peace of mind to enjoy a weekend manga binge.
              </p>
            </div>
          </div>
        </section>

        {/* What He Builds / Engineering Interests */}
        <section className="space-y-6 pt-4">
          <div className="border-b border-border/80 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              What I Actually Build &amp; Explore
            </h2>
            <p className="text-xs sm:text-sm font-mono text-fg-muted mt-1">
              No marketing speak—just systems, algorithms, models, and craft.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Low-Level & Systems */}
            <div className="p-5 rounded-xl bg-bg-surface border border-border hover:border-accent/50 transition-colors space-y-3">
              <div className="w-8 h-8 rounded-lg bg-bg-deep border border-border flex items-center justify-center text-accent">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-fg text-base">Low-Level &amp; Systems</h3>
              <p className="text-xs text-fg-muted leading-relaxed font-sans">
                Deeply curious about packet routing, dynamic topologies (Dijkstra SPF &amp; Bellman-Ford), course compiler pipelines (ASTs, lexing with Flex/Bison, assembly output), and OS internals in C and Python.
              </p>
              <div className="flex flex-wrap gap-1 font-mono text-[10px] text-fg-subtle pt-2 border-t border-border/50">
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">C/C++</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">Networking</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">Compilers</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">SQLite</span>
              </div>
            </div>

            {/* AI & Multi-Agent Loops */}
            <div className="p-5 rounded-xl bg-bg-surface border border-border hover:border-accent-secondary/50 transition-colors space-y-3">
              <div className="w-8 h-8 rounded-lg bg-bg-deep border border-border flex items-center justify-center text-accent-secondary">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-fg text-base">Modern AI &amp; Agents</h3>
              <p className="text-xs text-fg-muted leading-relaxed font-sans">
                Building autonomous reasoning loops, stateful multi-agent graphs with LangGraph, Whisper speech-to-speech translation pipelines, and prompt-driven diffusion generation platforms.
              </p>
              <div className="flex flex-wrap gap-1 font-mono text-[10px] text-fg-subtle pt-2 border-t border-border/50">
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">LangChain</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">LangGraph</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">Whisper</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">Diffusion</span>
              </div>
            </div>

            {/* Creative & Retro Computing */}
            <div className="p-5 rounded-xl bg-bg-surface border border-border hover:border-accent-tertiary/50 transition-colors space-y-3">
              <div className="w-8 h-8 rounded-lg bg-bg-deep border border-border flex items-center justify-center text-accent-tertiary">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-fg text-base">Creative &amp; Retro Coding</h3>
              <p className="text-xs text-fg-muted leading-relaxed font-sans">
                Bringing back the cozy tactile feel of 80s/90s computing: interactive browser terminals, CRT scanline shaders, canvas physics engines, and ASCII dithering terminal user interfaces.
              </p>
              <div className="flex flex-wrap gap-1 font-mono text-[10px] text-fg-subtle pt-2 border-t border-border/50">
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">TTYs</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">Canvas</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">ASCII Art</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-deep">CRT Shaders</span>
              </div>
            </div>
          </div>
        </section>

        {/* Currently Exploring & Focus */}
        <section className="p-5 sm:p-6 rounded-xl bg-bg-surface border border-border space-y-4">
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider font-semibold">
            <Compass className="w-4 h-4 text-accent animate-spin-slow" />
            <span>Active Radar // Currently Exploring</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            {personalInfo.currentFocus.map((focus, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-bg-deep border border-border/70 flex items-start gap-2.5"
              >
                <span className="text-accent font-bold mt-0.5">&gt;</span>
                <span className="text-fg-muted leading-relaxed">{focus}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Anime, Manga & Inspiration Section */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-fg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-secondary" />
                Fiction, Manga &amp; Creative Fuels
              </h2>
              <p className="text-xs sm:text-sm font-mono text-fg-muted mt-1">
                Why storytelling and manga inspire deeper engineering and perseverance.
              </p>
            </div>
            <a
              href={personalInfo.socials.myanimelist}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-xs font-mono text-accent hover:border-accent transition-colors"
            >
              <span>MyAnimeList Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-3 text-sm text-fg-muted leading-relaxed font-sans">
              <p>
                People often think of technical engineering and reading fiction as separate worlds. To me, they feed the exact same engine.
              </p>
              <p>
                In <span className="text-fg font-semibold">One Piece</span>, Eiichiro Oda demonstrates narrative scale and worldbuilding on an absurd, awe-inspiring level. In <span className="text-fg font-semibold">Naruto</span>, the core theme of relentless grit mirrors the stubborn endurance required to solve intractable software bugs.
              </p>
              <p>
                From <span className="text-fg font-semibold">Bleach</span>&apos;s peerless aesthetic style to <span className="text-fg font-semibold">Black Clover</span>&apos;s anti-magic teamwork and <span className="text-fg font-semibold">One Punch Man</span>&apos;s god-tier panel craft, manga reminds you to build with passion, style, and relentless curiosity.
              </p>
            </div>

            <div className="md:col-span-5 p-4 rounded-xl bg-bg-surface border border-border space-y-3">
              <div className="text-xs font-mono font-bold text-accent uppercase flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-accent-secondary" />
                All-Time Manga Influences
              </div>
              <ul className="space-y-2 font-mono text-xs text-fg-muted">
                <li className="p-2 rounded bg-bg-deep border border-border/50">
                  <div className="text-fg font-semibold">One Piece</div>
                  <div className="text-[11px] text-fg-subtle">Eiichiro Oda // Grand Adventure &amp; Worldbuilding</div>
                </li>
                <li className="p-2 rounded bg-bg-deep border border-border/50">
                  <div className="text-fg font-semibold">Naruto</div>
                  <div className="text-[11px] text-fg-subtle">Masashi Kishimoto // Tactical Combat &amp; Grit</div>
                </li>
                <li className="p-2 rounded bg-bg-deep border border-border/50">
                  <div className="text-fg font-semibold">Bleach</div>
                  <div className="text-[11px] text-fg-subtle">Tite Kubo // Character Drip &amp; Bankai Hype</div>
                </li>
                <li className="p-2 rounded bg-bg-deep border border-border/50">
                  <div className="text-fg font-semibold">Black Clover</div>
                  <div className="text-[11px] text-fg-subtle">Yūki Tabata // Teamwork &amp; Anti-Magic Hustle</div>
                </li>
                <li className="p-2 rounded bg-bg-deep border border-border/50">
                  <div className="text-fg font-semibold">One Punch Man</div>
                  <div className="text-[11px] text-fg-subtle">ONE / Yusuke Murata // God-Tier Art &amp; Subversion</div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Currently Reading Shelf */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-fg flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-tertiary" />
              Currently Reading &amp; Bookshelf
            </h2>
            <span className="text-xs font-mono text-fg-muted">Technical + Fiction</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {personalInfo.readingList.map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-bg-surface border border-border flex flex-col justify-between hover:border-accent/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="uppercase text-accent font-semibold">[{item.type}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        item.status === 'favorite'
                          ? 'bg-accent/15 text-accent font-bold'
                          : item.status === 'reading'
                          ? 'bg-accent-secondary/20 text-accent-secondary'
                          : 'bg-bg-deep text-fg-muted'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-fg text-sm">{item.title}</h4>
                  {item.author && (
                    <div className="text-xs text-fg-muted mt-0.5">{item.author}</div>
                  )}
                </div>
                {item.note && (
                  <p className="text-xs text-fg-muted/80 mt-3 pt-2 border-t border-border/50 italic">
                    &ldquo;{item.note}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Education & Background */}
        <section className="p-5 rounded-xl bg-bg-surface border border-border space-y-3">
          <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider font-semibold">
            <GraduationCap className="w-4 h-4 text-accent" />
            <span>Academic Background</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div>
              <div className="text-base font-bold text-fg">
                {personalInfo.education.degree}
              </div>
              <div className="text-xs font-mono text-accent-secondary">
                {personalInfo.education.institution}
              </div>
            </div>
            <div className="text-xs font-mono text-fg-muted px-2.5 py-1 rounded bg-bg-deep border border-border/60 self-start sm:self-auto">
              Focus: {personalInfo.education.focus}
            </div>
          </div>
        </section>

        {/* Footer / Contact Prompt */}
        <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="text-fg-muted text-center sm:text-left">
            <span>Want to discuss low-level systems or swap manga recommendations?</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-bg font-bold hover:opacity-90 shadow-crt transition-all"
            >
              <span>Say Hello</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={openTerminal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-fg-muted hover:text-fg transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-accent" />
              <span>&gt;_ CLI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
