'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { personalInfo } from '@/data/personal';
import { SCENE, PROJECT_ICONS, ICONS } from '@/components/journal/journalArt';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';

const INTERESTS = [
  {
    title: 'Low-level & systems',
    icon: PROJECT_ICONS.network,
    body: 'Deeply curious about packet routing, dynamic topologies (Dijkstra SPF & Bellman-Ford), course compiler pipelines (ASTs, lexing with Flex/Bison, assembly output), and OS internals in C and Python.',
    tags: ['C/C++', 'Networking', 'Compilers', 'SQLite'],
  },
  {
    title: 'Modern AI & agents',
    icon: PROJECT_ICONS.module,
    body: 'Building autonomous reasoning loops, stateful multi-agent graphs with LangGraph, Whisper speech-to-speech translation pipelines, and prompt-driven diffusion generation platforms.',
    tags: ['LangChain', 'LangGraph', 'Whisper', 'Diffusion'],
  },
  {
    title: 'Creative & retro coding',
    icon: PROJECT_ICONS.canvas,
    body: 'Bringing back the cozy tactile feel of 80s/90s computing: interactive browser terminals, CRT scanline shaders, canvas physics engines, and ASCII dithering terminal user interfaces.',
    tags: ['TTYs', 'Canvas', 'ASCII Art', 'CRT Shaders'],
  },
] as const;

const MANGA_INFLUENCES = [
  { title: 'One Piece', note: 'Eiichiro Oda // Grand adventure & worldbuilding' },
  { title: 'Naruto', note: 'Masashi Kishimoto // Tactical combat & grit' },
  { title: 'Bleach', note: 'Tite Kubo // Character drip & Bankai hype' },
  { title: 'Black Clover', note: 'Yūki Tabata // Teamwork & anti-magic hustle' },
  { title: 'One Punch Man', note: 'ONE / Yusuke Murata // God-tier art & subversion' },
] as const;

/**
 * About reads like a page torn from Huzbi's notebook: the story, what he
 * builds, the shelf and the education, all in his own voice.
 */
export default function AboutPage() {
  const { openTerminal } = useApp();

  return (
    <JournalPage
      title="Hey. I’m Huzefa, but most people online know me as Huzbi."
      lede={personalInfo.bio}
      art={
        <div className="j-page-art">
          <PixelArt grid={SCENE.catSitting} scale={7} label="The cat, sitting beside the desk" />
          <PixelArt grid={SCENE.tea} scale={6} />
        </div>
      }
    >
      <PixelPanel as="section" aria-labelledby="story-heading">
        <p className="j-kicker">Workspace / about_huzbi.md</p>
        <h2 id="story-heading">The short version</h2>
        <p>
          I graduated with a Bachelor&apos;s in Computer Science from FAST National
          University (NUCES) in Karachi. When I&apos;m not working, I build random
          experiments that occasionally get a little out of hand—spanning low-level
          systems and packet routing to modern multi-agent AI loops and retro
          creative coding.
        </p>
        <p className="j-muted">
          Current coordinates: {personalInfo.location}. The rest of this page is
          either a project, a book, or an opinion about one of them.
        </p>
      </PixelPanel>

      <PixelPanel as="section" tone="note" aria-labelledby="philosophy-heading">
        <p className="j-kicker">A note left on the desk</p>
        <h2 id="philosophy-heading">The “lazy dude” philosophy</h2>
        <p className="j-quote">
          “Write clean, deliberate code so you don&apos;t have to fix bugs on
          weekends.”
        </p>
        <p>
          I don&apos;t sound like a corporate LinkedIn robot because I genuinely
          care about how things work underneath. I don&apos;t care about buzzwords
          like “synergistic end-to-end paradigm accelerators.” I care about memory
          layouts, cache behavior, clean abstraction boundaries, and having enough
          peace of mind to enjoy a weekend manga binge.
        </p>
      </PixelPanel>

      <section className="j-section" aria-labelledby="builds-heading">
        <h2 id="builds-heading">What I actually build &amp; explore</h2>
        <p className="j-muted">
          No marketing speak—just systems, algorithms, models, and craft.
        </p>
        <div className="j-grid" data-cols="3">
          {INTERESTS.map((interest) => (
            <PixelPanel as="article" key={interest.title} className="j-card">
              <div className="j-card-art">
                <PixelArt grid={interest.icon} scale={4} />
              </div>
              <div className="j-card-body">
                <h3>{interest.title}</h3>
                <p>{interest.body}</p>
                <div className="j-row">
                  {interest.tags.map((tag) => (
                    <span className="j-chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </PixelPanel>
          ))}
        </div>
      </section>

      <PixelPanel as="section" tone="dim" aria-labelledby="focus-heading">
        <p className="j-kicker">Active radar</p>
        <h2 id="focus-heading">Currently exploring</h2>
        <ul className="j-list">
          {personalInfo.currentFocus.map((focus) => (
            <li key={focus}>{focus}</li>
          ))}
        </ul>
      </PixelPanel>

      <section className="j-section" aria-labelledby="fiction-heading">
        <h2 id="fiction-heading">Fiction, manga &amp; creative fuels</h2>
        <p className="j-muted">
          Why storytelling and manga inspire deeper engineering and perseverance.
        </p>
        <div className="j-grid">
          <PixelPanel as="article">
            <p>
              People often think of technical engineering and reading fiction as
              separate worlds. To me, they feed the exact same engine.
            </p>
            <p>
              In <strong>One Piece</strong>, Eiichiro Oda demonstrates narrative
              scale and worldbuilding on an absurd, awe-inspiring level. In{' '}
              <strong>Naruto</strong>, the core theme of relentless grit mirrors
              the stubborn endurance required to solve intractable software bugs.
            </p>
            <p>
              From <strong>Bleach</strong>&apos;s peerless aesthetic style to{' '}
              <strong>Black Clover</strong>&apos;s anti-magic teamwork and{' '}
              <strong>One Punch Man</strong>&apos;s god-tier panel craft, manga
              reminds you to build with passion, style, and relentless curiosity.
            </p>
            <div className="j-row">
              <a
                href={personalInfo.socials.myanimelist}
                target="_blank"
                rel="noopener noreferrer"
              >
                MyAnimeList profile
              </a>
            </div>
          </PixelPanel>

          <PixelPanel as="article" tone="dim" aria-labelledby="influences-heading">
            <p className="j-kicker">All-time shelf</p>
            <h3 id="influences-heading">Manga influences</h3>
            <ul className="j-list">
              {MANGA_INFLUENCES.map((manga) => (
                <li key={manga.title}>
                  <strong>{manga.title}</strong>
                  <span className="j-muted"> — {manga.note}</span>
                </li>
              ))}
            </ul>
          </PixelPanel>
        </div>
      </section>

      <section className="j-section" aria-labelledby="reading-heading">
        <h2 id="reading-heading">Currently reading &amp; bookshelf</h2>
        <p className="j-muted">Technical + fiction. Every title gets an opinion.</p>
        <ul className="j-list">
          {personalInfo.readingList.map((item, index) => (
            <li key={item.title} className="j-book">
              <span className="j-book-spine" data-i={index % 6} aria-hidden="true" />
              <span>
                <span className="j-book-head">
                  <span className="j-book-title">{item.title}</span>
                  {item.author ? (
                    <span className="j-book-author">{item.author}</span>
                  ) : null}
                  <span className="j-book-status">[{item.status}]</span>
                </span>
                {item.note ? <span className="j-book-note">“{item.note}”</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <PixelPanel as="section" tone="note" aria-labelledby="education-heading">
        <p className="j-kicker">Academic background</p>
        <h2 id="education-heading">{personalInfo.education.degree}</h2>
        <p>{personalInfo.education.institution}</p>
        <p className="j-muted">Focus: {personalInfo.education.focus}</p>
      </PixelPanel>

      <PixelPanel as="section" tone="dim" aria-labelledby="say-hi-heading">
        <p className="j-kicker">The door is open</p>
        <h2 id="say-hi-heading">Want to talk systems, or swap manga?</h2>
        <p className="j-muted">
          The desk is usually occupied. The mailbox is not.
        </p>
        <div className="j-row">
          <Link href="/contact/" className="j-btn">
            Say hello
          </Link>
          <button type="button" className="j-btn" data-kind="ghost" onClick={openTerminal}>
            <PixelArt grid={ICONS.bubble} scale={2} />
            Open the CLI
          </button>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
