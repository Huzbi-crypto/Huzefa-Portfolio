'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { personalInfo } from '@/data/personal';
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Radio,
  Sparkles,
  MessageSquare,
  Send,
  BookOpen,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { GithubIcon, TwitterIcon, LinkedInIcon } from '@/components/icons';

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

  const SOCIAL_CHANNELS = [
    {
      name: 'GitHub',
      handle: '@Huzbi-crypto',
      desc: '38 public repositories, systems code, network routing, and AI agents.',
      url: personalInfo.socials.github,
      icon: GithubIcon,
      accentColor: 'text-accent',
      borderColor: 'hover:border-accent/60',
      badge: 'CODE REPOS',
    },
    {
      name: 'Twitter / X',
      handle: '@HuzbiC',
      desc: 'Casual tech musings, random code snippets, anime banter, and hot takes.',
      url: personalInfo.socials.twitter,
      icon: TwitterIcon,
      accentColor: 'text-accent-tertiary',
      borderColor: 'hover:border-accent-tertiary/60',
      badge: 'MICROBLOG',
    },
    {
      name: 'LinkedIn',
      handle: 'Huzefa Saifuddin',
      desc: 'FAST NU CS graduate background and formal academic timeline.',
      url: personalInfo.socials.linkedin,
      icon: LinkedInIcon,
      accentColor: 'text-accent-secondary',
      borderColor: 'hover:border-accent-secondary/60',
      badge: 'ACADEMIC / NETWORK',
    },
    {
      name: 'MyAnimeList',
      handle: 'Huzbi',
      desc: 'Complete manga ratings, reading list logs, and favorite story arcs.',
      url: personalInfo.socials.myanimelist,
      icon: BookOpen,
      accentColor: 'text-accent-cream',
      borderColor: 'hover:border-accent-cream/60',
      badge: 'ANIME & MANGA',
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg font-sans pb-24 transition-colors duration-200">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-8 sm:pt-12 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-accent">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-fg-muted">channels</span>
            <span className="text-fg-subtle">/</span>
            <span className="font-semibold text-accent">contact.sh</span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
            <span>Transceiver: ONLINE</span>
          </div>
        </div>

        {/* Hero Header */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-bg-surface border border-border text-accent">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Direct Digital Mailbox</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            Get in Touch.
          </h1>

          <p className="text-base sm:text-lg text-fg-muted font-sans leading-relaxed max-w-2xl">
            Want to collaborate on a project, talk about low-level systems or multi-agent AI, recommend a great manga, or point out an embarrassing bug in my code?
          </p>
        </section>

        {/* Primary Email Transceiver Card */}
        <section className="p-6 sm:p-8 rounded-2xl bg-bg-surface border border-accent/40 shadow-crt relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-accent">
                <Mail className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider">
                  Primary Transceiver // ProtonMail
                </span>
              </div>
              <span className="text-[11px] font-mono text-fg-subtle">
                PGP / Encrypted Safe
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-fg-subtle uppercase tracking-wider">
                  Email Address
                </span>
                <div className="font-mono text-xl sm:text-2xl font-bold text-fg select-all break-all">
                  {personalInfo.email}
                </div>
              </div>

              {/* Action Buttons: Copy & Compose */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    copied
                      ? 'bg-accent text-bg border-accent shadow-crt'
                      : 'bg-bg-deep hover:bg-bg-hover text-accent border-border hover:border-accent'
                  }`}
                  aria-label="Copy email address to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-bg animate-in zoom-in" />
                      <span>[COPIED TO CLIPBOARD]</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${personalInfo.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-bold bg-accent text-bg hover:opacity-90 transition-opacity shadow-crt"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Mail</span>
                </a>
              </div>
            </div>

            {/* Ambient Transceiver Status Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 font-mono text-xs text-fg-muted">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Response: Usually &lt; 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-secondary" />
                <span>Spam Filter: Aggressive</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent-tertiary" />
                <span>Manga Recs: Always read</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ambient Pixel Mailbox / Telegraph Artifact */}
        <section className="p-5 rounded-xl bg-bg-deep border border-border font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-accent border-b border-border/50 pb-2">
            <span className="font-bold flex items-center gap-2">
              <span className="text-accent-secondary">&gt;</span>
              ROOM_TELEGRAPH_BUFFER.log
            </span>
            <span className="text-[10px] text-fg-subtle">BAUD: 9600 // TTY3</span>
          </div>

          <div className="space-y-1.5 text-fg-muted text-[11px] leading-relaxed">
            <div>[02:00:14] PACKET DISPATCHER INITIALIZED</div>
            <div>[02:00:15] ROUTE CHECK: Karachi, PK -&gt; Proton encrypted MX nodes [OK]</div>
            <div>[02:00:16] NOTICE: No recruiters offering &ldquo;unpaid rockstar synergy ninja&rdquo; gigs please.</div>
            <div className="text-accent">
              [02:00:17] WELCOME: Friendly inquiries, open-source hacking, research banter, and novel/manga chats are always prioritized.
            </div>
          </div>
        </section>

        {/* Social Link Cards */}
        <section className="space-y-4 pt-2">
          <div className="border-b border-border/80 pb-3">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Connected Profiles &amp; Social Feeds
            </h2>
            <p className="text-xs font-mono text-fg-muted mt-0.5">
              Other places I wander across the internet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_CHANNELS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-5 rounded-xl bg-bg-surface border border-border ${item.borderColor} transition-all duration-200 flex flex-col justify-between group hover:shadow-crt`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-bg-deep border border-border ${item.accentColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-fg text-sm group-hover:text-accent transition-colors">
                            {item.name}
                          </div>
                          <div className="font-mono text-xs text-fg-muted">
                            {item.handle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-deep border border-border/60 text-fg-subtle">
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-fg-muted leading-relaxed font-sans pt-1">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono text-accent pt-4 mt-3 border-t border-border/50 group-hover:translate-x-0.5 transition-transform">
                    <span>Visit Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Retro Terminal CTA */}
        <section className="p-5 rounded-xl bg-bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-mono text-xs font-bold text-accent">
              Prefer command-line interfaces?
            </div>
            <p className="text-xs text-fg-muted">
              Launch the retro CLI to run <code className="text-accent">cat contact</code> or inspect server specs.
            </p>
          </div>
          <button
            type="button"
            onClick={openTerminal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-deep hover:bg-accent/15 border border-border hover:border-accent text-accent font-mono text-xs font-semibold transition-colors"
          >
            <Terminal className="w-4 h-4" />
            <span>Open Terminal (Ctrl+`)</span>
          </button>
        </section>
      </div>
    </div>
  );
}
