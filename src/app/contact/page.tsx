'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { personalInfo } from '@/data/personal';
import { ICONS } from '@/components/journal/journalArt';
import { JournalPage } from '@/components/journal/JournalPage';
import { PixelPanel } from '@/components/journal/PixelPanel';
import { PixelArt } from '@/components/journal/PixelArt';

const SOCIAL_CHANNELS = [
  {
    name: 'GitHub',
    handle: '@Huzbi-crypto',
    desc: '38 public repositories, systems code, network routing, and AI agents.',
    url: personalInfo.socials.github,
    icon: ICONS.branch,
    badge: 'Code repos',
  },
  {
    name: 'Twitter / X',
    handle: '@HuzbiC',
    desc: 'Casual tech musings, random code snippets, anime banter, and hot takes.',
    url: personalInfo.socials.twitter,
    icon: ICONS.bubble,
    badge: 'Microblog',
  },
  {
    name: 'LinkedIn',
    handle: 'Huzefa Saifuddin',
    desc: 'FAST NU CS graduate background and formal academic timeline.',
    url: personalInfo.socials.linkedin,
    icon: ICONS.card,
    badge: 'Academic / network',
  },
  {
    name: 'MyAnimeList',
    handle: 'Huzbi',
    desc: 'Complete manga ratings, reading list logs, and favorite story arcs.',
    url: personalInfo.socials.myanimelist,
    icon: ICONS.book,
    badge: 'Anime & manga',
  },
] as const;

/**
 * The contact page is a letter left on the desk: one real address, the other
 * places Huzbi wanders, and the telegraph log that runs at 9600 baud.
 */
export default function ContactPage() {
  const { openTerminal } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personalInfo.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = personalInfo.email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <JournalPage
      title="Get in touch."
      lede="Want to collaborate on a project, talk about low-level systems or multi-agent AI, recommend a great manga, or point out an embarrassing bug in my code?"
      art={
        <div className="j-page-art">
          <PixelArt grid={ICONS.mail} scale={7} label="A sealed letter" />
        </div>
      }
    >
      <PixelPanel as="section" tone="note" aria-labelledby="address-heading">
        <p className="j-kicker">Direct digital mailbox</p>
        <h2 id="address-heading">Primary transceiver // ProtonMail</h2>
        <p className="j-address">{personalInfo.email}</p>
        <div className="j-row">
          <a href={`mailto:${personalInfo.email}`} className="j-btn">
            Send mail
          </a>
          <button
            type="button"
            className="j-btn"
            data-kind="ghost"
            onClick={handleCopyEmail}
            aria-label="Copy email address to clipboard"
          >
            {copied ? 'Copied to clipboard' : 'Copy address'}
          </button>
        </div>
        <ul className="j-meta">
          <li>Response: usually &lt; 24h</li>
          <li>Spam filter: aggressive</li>
          <li>Manga recs: always read</li>
        </ul>
      </PixelPanel>

      <PixelPanel as="section" tone="dim" aria-labelledby="log-heading">
        <p className="j-kicker">Room telegraph buffer</p>
        <h2 id="log-heading">BAUD: 9600 // TTY3</h2>
        <div className="j-stack">
          <p>[02:00:14] PACKET DISPATCHER INITIALIZED</p>
          <p>[02:00:15] ROUTE CHECK: Karachi, PK -&gt; Proton encrypted MX nodes [OK]</p>
          <p>
            [02:00:16] NOTICE: No recruiters offering &ldquo;unpaid rockstar
            synergy ninja&rdquo; gigs please.
          </p>
          <p>
            [02:00:17] WELCOME: Friendly inquiries, open-source hacking, research
            banter, and novel/manga chats are always prioritized.
          </p>
        </div>
      </PixelPanel>

      <section className="j-section" aria-labelledby="profiles-heading">
        <h2 id="profiles-heading">Connected profiles</h2>
        <p className="j-muted">Other places I wander across the internet.</p>
        <div className="j-grid">
          {SOCIAL_CHANNELS.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="j-panel j-card j-social"
              data-tone="plain"
            >
              <div className="j-card-art">
                <PixelArt grid={channel.icon} scale={4} />
              </div>
              <div className="j-card-body">
                <p className="j-kicker">{channel.badge}</p>
                <h3>{channel.name}</h3>
                <p className="j-status">{channel.handle}</p>
                <p>{channel.desc}</p>
                <p className="j-social-go">Visit profile →</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <PixelPanel as="section" tone="dim" aria-labelledby="cli-heading">
        <p className="j-kicker">Prefer a command line?</p>
        <h2 id="cli-heading">The room has a terminal.</h2>
        <p className="j-muted">
          Run <code>cat contact</code> or inspect the server specs. It also
          remembers whether you like your CRT scanlines.
        </p>
        <div className="j-row">
          <button type="button" className="j-btn" data-kind="ghost" onClick={openTerminal}>
            <PixelArt grid={ICONS.mail} scale={2} />
            Open terminal
          </button>
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
