'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { projects } from '@/data/projects';
import { personalInfo } from '@/data/personal';
import { Theme } from '@/types/portfolio';
import {
  Terminal as TerminalIcon,
  X,
  Maximize2,
  Minimize2,
  Minus,
  CornerDownLeft,
} from 'lucide-react';

interface TerminalEntry {
  id: string;
  command?: string;
  output: React.ReactNode;
}

const COMMAND_LIST = [
  'help',
  'ls',
  'cat about',
  'cat contact',
  'projects',
  'manga',
  'theme',
  'neofetch',
  'whoami',
  'pwd',
  'date',
  'clear',
  'exit',
];

export default function TerminalModal() {
  const {
    isTerminalOpen,
    closeTerminal,
    theme,
    setTheme,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const outputAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize greeting message on first mount
  useEffect(() => {
    setHistory([
      {
        id: 'init-1',
        output: (
          <div className="text-fg-muted font-mono text-xs space-y-1">
            <div className="text-accent font-bold text-sm tracking-wide">
              Huzbi Retro Interactive Shell (HuzbiSH v1.0.4)
            </div>
            <div className="text-fg-subtle text-[11px]">
              Type <code className="text-accent">&apos;help&apos;</code> to inspect system commands, or <code className="text-accent">&apos;neofetch&apos;</code> for specifications.
            </div>
          </div>
        ),
      },
    ]);
  }, []);

  // Autofocus input when modal is opened and scroll output area to bottom
  useEffect(() => {
    if (isTerminalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (outputAreaRef.current) {
          outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [isTerminalOpen]);

  // Scroll terminal output area to bottom when history updates (without scrolling page window)
  useEffect(() => {
    if (isTerminalOpen && outputAreaRef.current) {
      outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
    }
  }, [history, isTerminalOpen]);

  // Global Escape key to close terminal from anywhere
  useEffect(() => {
    if (!isTerminalOpen) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTerminal();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isTerminalOpen, closeTerminal]);

  // Handle Tab completion preview
  useEffect(() => {
    const trimmed = inputVal.trimStart().toLowerCase();
    if (!trimmed) {
      setSuggestion('');
      return;
    }
    const match = COMMAND_LIST.find((cmd) => cmd.startsWith(trimmed));
    if (match && match !== trimmed) {
      setSuggestion(match);
    } else {
      setSuggestion('');
    }
  }, [inputVal]);

  const executeCommand = (rawCommand: string) => {
    const cmd = rawCommand.trim();
    if (!cmd) return;

    // Append to command history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const parts = cmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    let outputNode: React.ReactNode = null;

    switch (mainCommand) {
      case 'help': {
        outputNode = (
          <div className="space-y-1 text-xs text-fg-muted font-mono">
            <div className="text-accent font-semibold mb-1">Available Commands:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div><span className="text-accent-tertiary font-bold">help</span> - Display this manual</div>
              <div><span className="text-accent-tertiary font-bold">ls</span> - List directories &amp; artifacts</div>
              <div><span className="text-accent-tertiary font-bold">cat about</span> - Read Huzbi&apos;s bio &amp; background</div>
              <div><span className="text-accent-tertiary font-bold">cat contact</span> - Direct contact channels</div>
              <div><span className="text-accent-tertiary font-bold">projects</span> - View featured lab artifacts</div>
              <div><span className="text-accent-tertiary font-bold">manga</span> - Reading list &amp; favorites</div>
              <div><span className="text-accent-tertiary font-bold">theme [name]</span> - Change active color theme</div>
              <div><span className="text-accent-tertiary font-bold">neofetch</span> - Retro system specifications</div>
              <div><span className="text-accent-tertiary font-bold">whoami</span> - Identity fingerprint</div>
              <div><span className="text-accent-tertiary font-bold">pwd</span> - Print working digital directory</div>
              <div><span className="text-accent-tertiary font-bold">clear</span> - Wipe terminal screen</div>
              <div><span className="text-accent-tertiary font-bold">exit</span> - Close terminal window</div>
            </div>
            <div className="text-[11px] text-fg-subtle pt-1">
              Hint: Use <kbd className="px-1 py-0.5 rounded bg-bg-surface border border-border">Tab</kbd> for completion, <kbd className="px-1 py-0.5 rounded bg-bg-surface border border-border">&uarr;</kbd> / <kbd className="px-1 py-0.5 rounded bg-bg-surface border border-border">&darr;</kbd> for history.
            </div>
          </div>
        );
        break;
      }

      case 'ls': {
        outputNode = (
          <div className="text-xs font-mono space-y-1">
            <div className="text-fg-subtle text-[11px]">drwxr-xr-x 2 huzbi huzbi 4096 2:00 AM</div>
            <div className="flex flex-wrap gap-4 text-accent font-semibold">
              <span className="text-accent-tertiary">about/</span>
              <span className="text-accent-tertiary">projects/</span>
              <span className="text-accent-tertiary">contact/</span>
              <span className="text-accent-tertiary">manga/</span>
              <span className="text-fg">specs.txt</span>
              <span className="text-fg">routing_sim.py</span>
              <span className="text-fg">notes.md</span>
            </div>
            <div className="text-fg-muted text-[11px]">
              Try: <code className="text-accent">cat about</code>, <code className="text-accent">cat contact</code>, or <code className="text-accent">projects</code>
            </div>
          </div>
        );
        break;
      }

      case 'cat': {
        if (arg === 'about') {
          outputNode = (
            <div className="space-y-2 text-xs font-mono leading-relaxed">
              <div className="text-accent font-bold text-sm">
                == Huzefa Saifuddin (Huzbi) ==
              </div>
              <div className="text-fg">
                Hey. I&apos;m Huzefa, but most people online know me as <span className="text-accent font-semibold">Huzbi</span>.
              </div>
              <div className="text-fg-muted">
                I graduated with a Computer Science degree from FAST National University (NUCES) in Karachi. I spend my time digging into low-level systems (C/C++, routing algorithms, custom parsers, memory models) as well as modern generative AI &amp; LangChain agent graphs.
              </div>
              <div className="text-accent-cream bg-bg-surface/70 p-2.5 rounded border border-border">
                <span className="text-accent-secondary font-bold">&gt; The Lazy Dude Philosophy:</span>
                <br />
                &ldquo;Write clean, robust code so you never have to fix bugs on weekends.&rdquo;
              </div>
              <div className="text-fg-subtle text-[11px]">
                Offline fuels: Stacks of manga, loose leaf tea, mechanical clicks, and late-night curiosity.
              </div>
            </div>
          );
        } else if (arg === 'contact') {
          outputNode = (
            <div className="space-y-2 text-xs font-mono">
              <div className="text-accent font-bold">== Contact Channels ==</div>
              <div className="grid grid-cols-1 gap-1 text-fg-muted">
                <div>
                  <span className="text-accent-secondary font-semibold">Email:</span>{' '}
                  <a href="mailto:xhuzbi@proton.me" className="text-fg hover:underline">
                    xhuzbi@proton.me
                  </a>
                </div>
                <div>
                  <span className="text-accent-secondary font-semibold">GitHub:</span>{' '}
                  <a href="https://github.com/Huzbi-crypto" target="_blank" rel="noreferrer" className="text-fg hover:underline">
                    https://github.com/Huzbi-crypto
                  </a>
                </div>
                <div>
                  <span className="text-accent-secondary font-semibold">Twitter/X:</span>{' '}
                  <a href="https://twitter.com/HuzbiC" target="_blank" rel="noreferrer" className="text-fg hover:underline">
                    @HuzbiC
                  </a>
                </div>
                <div>
                  <span className="text-accent-secondary font-semibold">LinkedIn:</span>{' '}
                  <a href="https://www.linkedin.com/in/huzefa-saifuddin-95720b241/" target="_blank" rel="noreferrer" className="text-fg hover:underline">
                    linkedin.com/in/huzefa-saifuddin-95720b241
                  </a>
                </div>
                <div>
                  <span className="text-accent-secondary font-semibold">MyAnimeList:</span>{' '}
                  <a href="https://myanimelist.net/profile/Huzbi" target="_blank" rel="noreferrer" className="text-fg hover:underline">
                    myanimelist.net/profile/Huzbi
                  </a>
                </div>
              </div>
            </div>
          );
        } else if (arg === 'specs.txt' || arg === 'specs') {
          outputNode = (
            <div className="text-xs font-mono text-fg-muted space-y-1">
              <div className="text-accent font-bold">Huzbi System Specifications:</div>
              <div>OS: HuzbiOS Linux x86_64</div>
              <div>Shell: HuzbiSH (bash/zsh hybrid)</div>
              <div>Rig: FAST NU Workstation // 2 AM CRT Monitor</div>
              <div>Status: Drinking tea, writing compilers, reading manga</div>
            </div>
          );
        } else {
          outputNode = (
            <div className="text-xs font-mono text-red-400">
              cat: {arg ? arg : 'missing argument'}: No such file or directory. Try: <code className="text-accent">cat about</code> or <code className="text-accent">cat contact</code>
            </div>
          );
        }
        break;
      }

      case 'about': {
        executeCommand('cat about');
        return;
      }

      case 'contact': {
        executeCommand('cat contact');
        return;
      }

      case 'projects': {
        outputNode = (
          <div className="space-y-3 text-xs font-mono">
            <div className="text-accent font-bold">
              == Featured Laboratory Artifacts &amp; Repositories ==
            </div>
            <div className="space-y-2">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="p-2 rounded bg-bg-surface border border-border/70">
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-semibold">{p.title}</span>
                    <span className="text-[10px] text-accent-tertiary uppercase">{p.visual.asciiBadge}</span>
                  </div>
                  <div className="text-fg-muted text-[11px] mt-0.5">{p.tagline}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                    <span className="text-fg-subtle">Stack: {p.techStack.slice(0, 3).join(', ')}</span>
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline ml-auto"
                    >
                      [view repository &rarr;]
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-fg-subtle text-[11px]">
              Type <code className="text-accent">cat about</code> to read background or visit the /projects page.
            </div>
          </div>
        );
        break;
      }

      case 'manga':
      case 'shelf': {
        outputNode = (
          <div className="space-y-2 text-xs font-mono">
            <div className="text-accent font-bold">== Reading Shelf &amp; Manga Vault ==</div>
            <div className="text-fg-muted">
              Why manga? Uncompromising artwork, gripping worldbuilding, and relentless character resolve.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-bg-surface border border-border">
                <div className="text-accent font-bold">One Piece</div>
                <div className="text-fg-subtle text-[11px]">Eiichiro Oda</div>
                <div className="text-fg-muted text-[11px] mt-1">&ldquo;The pinnacle of grand adventure, absurd worldbuilding, and pure freedom.&rdquo;</div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border">
                <div className="text-accent font-bold">Naruto</div>
                <div className="text-fg-subtle text-[11px]">Masashi Kishimoto</div>
                <div className="text-fg-muted text-[11px] mt-1">&ldquo;Tactical ninja combat and the stubborn resolve to never back down.&rdquo;</div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border">
                <div className="text-accent font-bold">Bleach</div>
                <div className="text-fg-subtle text-[11px]">Tite Kubo</div>
                <div className="text-fg-muted text-[11px] mt-1">&ldquo;Peerless character drip, stylish paneling, and Bankai releases.&rdquo;</div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border">
                <div className="text-accent font-bold">Black Clover</div>
                <div className="text-fg-subtle text-[11px]">Yūki Tabata</div>
                <div className="text-fg-muted text-[11px] mt-1">&ldquo;High-octane pacing, magic teamwork, and Asta&apos;s anti-magic hustle.&rdquo;</div>
              </div>
              <div className="p-2 rounded bg-bg-surface border border-border sm:col-span-2">
                <div className="text-accent font-bold">One Punch Man</div>
                <div className="text-fg-subtle text-[11px]">ONE / Yusuke Murata</div>
                <div className="text-fg-muted text-[11px] mt-1">&ldquo;Yusuke Murata&apos;s god-tier visual spreads and hilarious subversion of superhero stakes.&rdquo;</div>
              </div>
            </div>
            <div className="pt-1 text-fg-subtle text-[11px]">
              Full tracker on MyAnimeList:{' '}
              <a
                href={personalInfo.socials.myanimelist}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline"
              >
                myanimelist.net/profile/Huzbi
              </a>
            </div>
          </div>
        );
        break;
      }

      case 'theme': {
        const targetTheme = arg as Theme;
        if (targetTheme === 'cozy-crt' || targetTheme === 'warm-apartment' || targetTheme === 'moonlit-terminal') {
          setTheme(targetTheme);
          outputNode = (
            <div className="text-xs font-mono text-accent">
              &gt; Active color scheme updated to: <span className="font-bold underline">{targetTheme}</span>
            </div>
          );
        } else if (!arg) {
          outputNode = (
            <div className="text-xs font-mono space-y-1">
              <div className="text-fg-muted">Current Theme: <span className="text-accent font-bold">{theme}</span></div>
              <div className="text-fg-subtle">Available options:</div>
              <div className="text-accent">
                - cozy-crt (Default Green CRT)<br />
                - warm-apartment (Amber / Terracotta warmth)<br />
                - moonlit-terminal (Cyan / Blue phosphor)
              </div>
              <div className="text-fg-muted text-[11px]">Usage: <code className="text-accent">theme cozy-crt</code></div>
            </div>
          );
        } else {
          outputNode = (
            <div className="text-xs font-mono text-red-400">
              Unknown theme &apos;{arg}&apos;. Available: <span className="text-accent">cozy-crt</span>, <span className="text-accent">warm-apartment</span>, <span className="text-accent">moonlit-terminal</span>.
            </div>
          );
        }
        break;
      }

      case 'neofetch': {
        outputNode = (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs font-mono py-1">
            <div className="sm:col-span-5 text-accent select-none font-bold text-[11px] sm:text-xs leading-none whitespace-pre">
{`
    /\\_/\\      
   ( o.o )     
    > ^ <      
  /|     |\\    
 (_|  _  |_)   
   '--'--'     
`}
              <div className="text-fg-muted text-[10px] text-center sm:text-left mt-1">
                huzbi@digital-room
              </div>
            </div>
            <div className="sm:col-span-7 space-y-1 text-fg-muted text-[11px] sm:text-xs">
              <div className="text-accent font-bold border-b border-border/60 pb-1">
                huzbi@room ~ 2:00 AM
              </div>
              <div><span className="text-accent font-semibold">OS:</span> HuzbiOS x86_64</div>
              <div><span className="text-accent font-semibold">Host:</span> FAST NU CS Digital Room (Graduate)</div>
              <div><span className="text-accent font-semibold">Kernel:</span> 6.1.0-huzbi-zen</div>
              <div><span className="text-accent font-semibold">Uptime:</span> 420 hrs, 69 tea mugs</div>
              <div><span className="text-accent font-semibold">Shell:</span> HuzbiSH v1.0.4</div>
              <div><span className="text-accent font-semibold">Terminal:</span> Phosphor CRT Display</div>
              <div><span className="text-accent font-semibold">CPU:</span> Mind Overclocked @ 4.2GHz</div>
              <div><span className="text-accent font-semibold">Manga:</span> One Piece, Naruto, Bleach, Black Clover, One Punch Man</div>
              <div><span className="text-accent font-semibold">Philosophy:</span> Lazy dude: clean code = free weekends</div>
              {/* Retro color swatches */}
              <div className="flex gap-1 pt-2">
                <span className="w-3 h-3 bg-red-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-amber-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-yellow-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-cyan-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-blue-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-purple-400 rounded-sm inline-block" />
                <span className="w-3 h-3 bg-pink-400 rounded-sm inline-block" />
              </div>
            </div>
          </div>
        );
        break;
      }

      case 'whoami': {
        outputNode = (
          <div className="text-xs font-mono space-y-1 text-fg-muted">
            <div><span className="text-accent font-bold">huzbi</span> (Huzefa Saifuddin)</div>
            <div>Computer Science Graduate @ FAST NUCES Karachi</div>
            <div>Low-level Systems Hacker &amp; AI Builder</div>
            <div>&ldquo;I like to code and read manga &apos;n books.&rdquo;</div>
          </div>
        );
        break;
      }

      case 'pwd': {
        outputNode = (
          <div className="text-xs font-mono text-accent">
            /home/huzbi/room/workspace
          </div>
        );
        break;
      }

      case 'date': {
        outputNode = (
          <div className="text-xs font-mono text-fg-muted">
            {new Date().toString()} [2:00 AM Digital Room Time]
          </div>
        );
        break;
      }

      case 'echo': {
        outputNode = (
          <div className="text-xs font-mono text-fg">
            {parts.slice(1).join(' ')}
          </div>
        );
        break;
      }

      case 'clear': {
        setHistory([]);
        setInputVal('');
        return;
      }

      case 'exit':
      case 'quit': {
        closeTerminal();
        return;
      }

      default: {
        outputNode = (
          <div className="text-xs font-mono text-red-400">
            command not found: <span className="font-bold text-fg">{cmd}</span>. Type <code className="text-accent underline cursor-pointer" onClick={() => executeCommand('help')}>help</code> for available commands.
          </div>
        );
      }
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        command: cmd,
        output: outputNode,
      },
    ]);

    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInputVal(suggestion);
      }
    } else if (e.key === 'Escape') {
      closeTerminal();
    }
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Retro Terminal Interactive Shell"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeTerminal();
        }
      }}
    >
      <div
        ref={containerRef}
        className={`w-full bg-bg-deep border-2 border-accent/80 rounded-xl shadow-crt flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 w-auto h-auto max-w-none'
            : 'max-w-3xl h-[80vh] max-h-[640px]'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Header Bar */}
        <div className="bg-bg-surface border-b border-border px-3 py-2 flex items-center justify-between select-none font-mono text-xs">
          <div className="flex items-center gap-2 text-accent">
            <TerminalIcon className="w-4 h-4 text-accent animate-pulse-subtle" />
            <span className="font-bold tracking-wide">huzbi@room: ~ (tty1)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick hotkey hint */}
            <span className="hidden sm:inline-block text-[10px] text-fg-subtle px-1.5 py-0.5 rounded bg-bg-deep border border-border">
              esc to exit
            </span>

            {/* Minimize */}
            <button
              type="button"
              onClick={closeTerminal}
              className="p-1 text-fg-muted hover:text-fg hover:bg-bg-hover rounded transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
              title="Close terminal"
              aria-label="Close terminal window"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-fg-muted hover:text-fg hover:bg-bg-hover rounded transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
              title={isFullscreen ? 'Restore window size' : 'Maximize window'}
              aria-label={isFullscreen ? 'Restore window size' : 'Maximize window'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={closeTerminal}
              className="p-1 text-fg-muted hover:text-red-400 hover:bg-red-950/40 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
              title="Close terminal"
              aria-label="Close terminal window"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Command Shortcuts Toolbar (Great for Mobile & Quick Exploration) */}
        <div className="bg-bg-surface/60 border-b border-border/50 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar">
          <span className="text-fg-subtle text-[10px] uppercase font-semibold mr-1 shrink-0">
            Quick:
          </span>
          {[
            'help',
            'neofetch',
            'projects',
            'manga',
            'cat about',
            'cat contact',
            'clear',
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                executeCommand(cmd);
              }}
              className="px-2 py-0.5 rounded bg-bg-deep hover:bg-accent/20 border border-border/60 hover:border-accent/60 text-fg-muted hover:text-accent whitespace-nowrap transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Terminal Output Area */}
        <div ref={outputAreaRef} className="flex-1 p-3 sm:p-4 overflow-y-auto font-mono text-xs sm:text-sm space-y-3 selection:bg-accent selection:text-bg">
          {history.map((entry) => (
            <div key={entry.id} className="space-y-1">
              {entry.command && (
                <div className="flex items-center gap-2 text-accent font-semibold">
                  <span className="text-accent-secondary">huzbi@room ~ $</span>
                  <span className="text-fg">{entry.command}</span>
                </div>
              )}
              {entry.output && <div className="pl-0 sm:pl-2">{entry.output}</div>}
            </div>
          ))}

          {/* Active Input Line */}
          <div className="flex items-center gap-2 text-accent pt-1">
            <span className="text-accent-secondary font-semibold shrink-0">
              huzbi@room ~ $
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-fg font-mono text-xs sm:text-sm outline-none border-none p-0 focus:ring-0"
                autoFocus
                spellCheck={false}
                autoComplete="off"
                aria-label="Terminal command prompt input"
              />
              {/* Tab Completion Ghost Suggestion */}
              {suggestion && inputVal && suggestion.startsWith(inputVal) && (
                <span className="absolute left-0 top-0 pointer-events-none text-fg-subtle font-mono text-xs sm:text-sm">
                  <span className="opacity-0">{inputVal}</span>
                  <span>{suggestion.slice(inputVal.length)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Terminal Bottom Status Bar */}
        <div className="bg-bg-surface border-t border-border/80 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-fg-muted">
          <div className="flex items-center gap-3">
            <span className="text-accent font-semibold">UTF-8</span>
            <span>Shell: HuzbiSH</span>
            <span className="hidden sm:inline">Palette: {theme}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden xs:inline text-fg-subtle">
              Type <code className="text-accent">&apos;exit&apos;</code> to close
            </span>
            <CornerDownLeft className="w-3.5 h-3.5 text-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
