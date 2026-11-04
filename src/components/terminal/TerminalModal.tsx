'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { projects } from '@/data/projects';
import { personalInfo } from '@/data/personal';
import { award as awardStar, loadProgress, saveProgress } from '@/game/state/progress';
import { Theme } from '@/types/portfolio';

interface TerminalEntry {
  id: string;
  command?: string;
  output: React.ReactNode;
}

/** The one hidden command. It is not listed by `help`, on purpose. */
export const TERMINAL_SECRET_STAR = 'silly:terminal-secret';

/**
 * Save the terminal's hidden star. The terminal sits outside the canvas game,
 * so it writes through the same progress store the game loads on its next
 * visit rather than touching the running game's memory.
 */
export function awardTerminalSecret(storage: Storage | null): boolean {
  const progress = loadProgress(storage);
  if (!awardStar(progress, TERMINAL_SECRET_STAR)) return false;

  saveProgress(storage, progress);
  return true;
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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

const THEMES: Theme[] = ['cozy-crt', 'warm-apartment', 'moonlit-terminal'];

/** The little swatch row at the bottom of `neofetch`. */
const SWATCHES = ['#b04448', '#f0a93c', '#ffd97a', '#7fdc8a', '#52a3a8', '#3f5fa8', '#8e5fb5', '#e8d9b0'];

const Prompt = () => <span className="term-echo-prompt">huzbi@room ~ $</span>;

export default function TerminalModal() {
  const { isTerminalOpen, closeTerminal, theme, setTheme } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const outputAreaRef = useRef<HTMLDivElement>(null);

  // Greeting on first mount.
  useEffect(() => {
    setHistory([
      {
        id: 'init-1',
        output: (
          <div className="term-dim">
            <div className="term-accent" style={{ fontSize: '1.15em' }}>
              Huzbi Retro Interactive Shell (HuzbiSH v1.0.4)
            </div>
            <div className="term-subtle">
              Type &apos;help&apos; to inspect system commands, or &apos;neofetch&apos; for specifications.
            </div>
          </div>
        ),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isTerminalOpen) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
        if (outputAreaRef.current) {
          outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
        }
      }, 50);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isTerminalOpen]);

  useEffect(() => {
    if (isTerminalOpen && outputAreaRef.current) {
      outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
    }
  }, [history, isTerminalOpen]);

  useEffect(() => {
    if (!isTerminalOpen) return;

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTerminal();
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isTerminalOpen, closeTerminal]);

  // Tab completion preview.
  useEffect(() => {
    const trimmed = inputVal.trimStart().toLowerCase();
    if (!trimmed) {
      setSuggestion('');
      return;
    }
    const match = COMMAND_LIST.find((cmd) => cmd.startsWith(trimmed));
    setSuggestion(match && match !== trimmed ? match : '');
  }, [inputVal]);

  const executeCommand = (rawCommand: string) => {
    const cmd = rawCommand.trim();
    if (!cmd) return;

    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const parts = cmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    let outputNode: React.ReactNode = null;

    switch (mainCommand) {
      case 'help': {
        outputNode = (
          <div className="term-dim">
            <div className="term-accent term-line">Available commands:</div>
            <div className="term-grid">
              <div><span className="term-cream">help</span> - this manual</div>
              <div><span className="term-cream">ls</span> - list directories and artifacts</div>
              <div><span className="term-cream">cat about</span> - Huzbi&apos;s bio and background</div>
              <div><span className="term-cream">cat contact</span> - direct contact channels</div>
              <div><span className="term-cream">projects</span> - featured lab artifacts</div>
              <div><span className="term-cream">manga</span> - reading list and favorites</div>
              <div><span className="term-cream">theme [name]</span> - change the room&apos;s light</div>
              <div><span className="term-cream">neofetch</span> - retro system specifications</div>
              <div><span className="term-cream">whoami</span> - identity fingerprint</div>
              <div><span className="term-cream">pwd</span> - print working directory</div>
              <div><span className="term-cream">date</span> - the time, allegedly</div>
              <div><span className="term-cream">echo</span> - say it back</div>
              <div><span className="term-cream">clear</span> - wipe the screen</div>
              <div><span className="term-cream">exit</span> - close the terminal</div>
            </div>
            <div className="term-subtle term-line">
              Tab completes, <span className="term-kbd">&uarr;</span> / <span className="term-kbd">&darr;</span> walks history.
              Undocumented commands exist. Obviously.
            </div>
          </div>
        );
        break;
      }

      case 'ls': {
        outputNode = (
          <div className="term-dim">
            <div className="term-subtle">drwxr-xr-x 2 huzbi huzbi 4096 2:00 AM</div>
            <div className="term-grid term-accent">
              <span>about/</span>
              <span>projects/</span>
              <span>contact/</span>
              <span>manga/</span>
              <span className="term-cream">specs.txt</span>
              <span className="term-cream">routing_sim.py</span>
              <span className="term-cream">notes.md</span>
            </div>
            <div className="term-subtle term-line">
              Try: <span className="term-accent">cat about</span>, <span className="term-accent">cat contact</span>, or <span className="term-accent">projects</span>
            </div>
          </div>
        );
        break;
      }

      case 'cat': {
        if (arg === 'about') {
          outputNode = (
            <div className="term-dim">
              <div className="term-accent" style={{ fontSize: '1.1em' }}>
                == Huzefa Saifuddin (Huzbi) ==
              </div>
              <div className="term-cream term-line">
                Hey. I&apos;m Huzefa, but most people online know me as <span className="term-accent">Huzbi</span>.
              </div>
              <div className="term-line">
                I graduated with a Computer Science degree from FAST National University (NUCES) in Karachi. I spend my time digging into low-level systems (C/C++, routing algorithms, custom parsers, memory models) as well as modern generative AI and LangChain agent graphs.
              </div>
              <div className="term-card">
                <div className="term-warn">The Lazy Dude Philosophy:</div>
                <div>&ldquo;Write clean, robust code so you never have to fix bugs on weekends.&rdquo;</div>
              </div>
              <div className="term-subtle term-line">
                Offline fuels: stacks of manga, loose leaf tea, mechanical clicks, late-night curiosity.
              </div>
            </div>
          );
        } else if (arg === 'contact') {
          outputNode = (
            <div className="term-dim">
              <div className="term-accent term-line">== Contact Channels ==</div>
              <div className="term-line">
                <span className="term-warn">Email:</span>{' '}
                <a href="mailto:xhuzbi@proton.me" className="term-link">xhuzbi@proton.me</a>
              </div>
              <div className="term-line">
                <span className="term-warn">GitHub:</span>{' '}
                <a href="https://github.com/Huzbi-crypto" target="_blank" rel="noreferrer" className="term-link">github.com/Huzbi-crypto</a>
              </div>
              <div className="term-line">
                <span className="term-warn">Twitter/X:</span>{' '}
                <a href="https://twitter.com/HuzbiC" target="_blank" rel="noreferrer" className="term-link">@HuzbiC</a>
              </div>
              <div className="term-line">
                <span className="term-warn">LinkedIn:</span>{' '}
                <a href="https://www.linkedin.com/in/huzefa-saifuddin-95720b241/" target="_blank" rel="noreferrer" className="term-link">huzefa-saifuddin</a>
              </div>
              <div className="term-line">
                <span className="term-warn">MyAnimeList:</span>{' '}
                <a href={personalInfo.socials.myanimelist} target="_blank" rel="noreferrer" className="term-link">myanimelist.net/profile/Huzbi</a>
              </div>
            </div>
          );
        } else if (arg === 'specs.txt' || arg === 'specs') {
          outputNode = (
            <div className="term-dim">
              <div className="term-accent term-line">Huzbi System Specifications:</div>
              <div>OS: HuzbiOS Linux x86_64</div>
              <div>Shell: HuzbiSH (bash/zsh hybrid)</div>
              <div>Rig: FAST NU workstation // 2 AM CRT monitor</div>
              <div>Status: drinking tea, writing compilers, reading manga</div>
            </div>
          );
        } else {
          outputNode = (
            <div className="term-warn">
              cat: {arg ? arg : 'missing argument'}: no such file or directory. Try <span className="term-accent">cat about</span> or <span className="term-accent">cat contact</span>.
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
          <div className="term-dim">
            <div className="term-accent term-line">== Featured Laboratory Artifacts &amp; Repositories ==</div>
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="term-card">
                <div className="term-card-row">
                  <span className="term-accent">{project.title}</span>
                  <span className="term-subtle">{project.visual.asciiBadge}</span>
                </div>
                <div className="term-subtle">{project.tagline}</div>
                <div className="term-card-row">
                  <span className="term-subtle">Stack: {project.techStack.slice(0, 3).join(', ')}</span>
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="term-link">[repo &rarr;]</a>
                </div>
              </div>
            ))}
            <div className="term-subtle term-line">
              Type <span className="term-accent">cat about</span> for background, or visit the projects journal.
            </div>
          </div>
        );
        break;
      }

      case 'manga':
      case 'shelf': {
        outputNode = (
          <div className="term-dim">
            <div className="term-accent term-line">== Reading Shelf &amp; Manga Vault ==</div>
            <div className="term-line">
              Why manga? Uncompromising artwork, gripping worldbuilding, relentless character resolve.
            </div>
            <div className="term-grid">
              <div className="term-card">
                <div className="term-accent">One Piece</div>
                <div className="term-subtle">Eiichiro Oda</div>
                <div>&ldquo;The pinnacle of grand adventure, absurd worldbuilding, and pure freedom.&rdquo;</div>
              </div>
              <div className="term-card">
                <div className="term-accent">Naruto</div>
                <div className="term-subtle">Masashi Kishimoto</div>
                <div>&ldquo;Tactical ninja combat and the stubborn resolve to never back down.&rdquo;</div>
              </div>
              <div className="term-card">
                <div className="term-accent">Bleach</div>
                <div className="term-subtle">Tite Kubo</div>
                <div>&ldquo;Peerless character drip, stylish paneling, and Bankai releases.&rdquo;</div>
              </div>
              <div className="term-card">
                <div className="term-accent">Black Clover</div>
                <div className="term-subtle">Yuki Tabata</div>
                <div>&ldquo;High-octane pacing, magic teamwork, and Asta&apos;s anti-magic hustle.&rdquo;</div>
              </div>
              <div className="term-card">
                <div className="term-accent">One Punch Man</div>
                <div className="term-subtle">ONE / Yusuke Murata</div>
                <div>&ldquo;God-tier visual spreads and a hilarious subversion of superhero stakes.&rdquo;</div>
              </div>
            </div>
            <div className="term-subtle term-line">
              Full tracker on MyAnimeList:{' '}
              <a href={personalInfo.socials.myanimelist} target="_blank" rel="noreferrer" className="term-link">
                myanimelist.net/profile/Huzbi
              </a>
            </div>
          </div>
        );
        break;
      }

      case 'theme': {
        if (arg && (THEMES as string[]).includes(arg)) {
          const next = arg as Theme;
          setTheme(next);
          outputNode = (
            <div className="term-accent">
              &gt; Room light set to <span className="term-cream">{next}</span>. No reload. No excuses.
            </div>
          );
        } else if (!arg) {
          outputNode = (
            <div className="term-dim">
              <div>Current theme: <span className="term-accent">{theme}</span></div>
              <div className="term-subtle term-line">Available:</div>
              <div>cozy-crt (phosphor midnight)</div>
              <div>warm-apartment (terracotta afternoon)</div>
              <div>moonlit-terminal (cool blue starlight)</div>
              <div className="term-subtle term-line">
                Usage: <span className="term-accent">theme warm-apartment</span>
              </div>
            </div>
          );
        } else {
          outputNode = (
            <div className="term-warn">
              Unknown theme &apos;{arg}&apos;. Available: <span className="term-accent">cozy-crt</span>, <span className="term-accent">warm-apartment</span>, <span className="term-accent">moonlit-terminal</span>.
            </div>
          );
        }
        break;
      }

      case 'neofetch': {
        outputNode = (
          <div className="term-dim">
            <div className="term-grid">
              <div>
                <pre className="term-ascii">{`    /\\_/\\      \n   ( o.o )     \n    > ^ <      \n  /|     |\\    \n (_|  _  |_)   \n   '--'--'     `}</pre>
                <div className="term-subtle">huzbi@digital-room</div>
              </div>
              <div>
                <div className="term-accent" style={{ borderBottom: '2px solid var(--color-border)' }}>
                  huzbi@room ~ 2:00 AM
                </div>
                <div><span className="term-accent">OS:</span> HuzbiOS x86_64</div>
                <div><span className="term-accent">Host:</span> FAST NU CS digital room (graduate)</div>
                <div><span className="term-accent">Kernel:</span> 6.1.0-huzbi-zen</div>
                <div><span className="term-accent">Uptime:</span> 420 hrs, 69 tea mugs</div>
                <div><span className="term-accent">Shell:</span> HuzbiSH v1.0.4</div>
                <div><span className="term-accent">Terminal:</span> phosphor CRT display</div>
                <div><span className="term-accent">CPU:</span> mind overclocked @ 4.2GHz</div>
                <div><span className="term-accent">Manga:</span> One Piece, Naruto, Bleach, Black Clover, One Punch Man</div>
                <div><span className="term-accent">Philosophy:</span> lazy dude; clean code = free weekends</div>
                <div className="term-swatches" aria-hidden="true">
                  {SWATCHES.map((color) => (
                    <span key={color} className="term-swatch" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        break;
      }

      case 'whoami': {
        outputNode = (
          <div className="term-dim">
            <div><span className="term-accent">huzbi</span> (Huzefa Saifuddin)</div>
            <div>Computer Science graduate @ FAST NUCES Karachi</div>
            <div>Low-level systems hacker and AI builder</div>
            <div>&ldquo;I like to code and read manga &apos;n books.&rdquo;</div>
          </div>
        );
        break;
      }

      case 'pwd': {
        outputNode = <div className="term-accent">/home/huzbi/room/workspace</div>;
        break;
      }

      case 'date': {
        outputNode = (
          <div className="term-dim">
            {new Date().toString()} [2:00 AM digital room time]
          </div>
        );
        break;
      }

      case 'echo': {
        outputNode = <div className="term-cream">{parts.slice(1).join(' ')}</div>;
        break;
      }

      case 'xyzzy': {
        const first = awardTerminalSecret(browserStorage());
        outputNode = (
          <div className="term-dim">
            <div className="term-accent term-line">A hollow voice says: &ldquo;nothing happens.&rdquo;</div>
            <div className="term-line">
              Except, apparently, a star. The terminal respects that you typed nonsense into a
              stranger&apos;s computer. It is not sure why.
            </div>
            {first ? (
              <div className="term-cream term-line">+1 star. The cat saw nothing.</div>
            ) : (
              <div className="term-subtle term-line">You already found this one. The hollow voice is still disappointed.</div>
            )}
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
          <div className="term-warn">
            command not found: <span className="term-cream">{cmd}</span>. Type{' '}
            <button type="button" className="term-link" onClick={() => executeCommand('help')}>
              help
            </button>{' '}
            for available commands.
          </div>
        );
      }
    }

    setHistory((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, command: cmd, output: outputNode },
    ]);
    setInputVal('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      executeCommand(inputVal);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (suggestion) setInputVal(suggestion);
    } else if (event.key === 'Escape') {
      closeTerminal();
    }
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      className="term-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Retro Terminal Interactive Shell"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeTerminal();
      }}
    >
      <div className="term-window" data-fullscreen={isFullscreen} onClick={() => inputRef.current?.focus()}>
        <div className="term-titlebar">
          <div className="term-title">
            <span className="term-title-icon" aria-hidden="true" />
            <span>huzbi@room: ~ (tty1)</span>
          </div>

          <div className="term-lights">
            <span className="term-subtle" style={{ fontSize: 13, marginRight: 4 }}>
              esc
            </span>
            <button type="button" className="term-light" onClick={closeTerminal} aria-label="Minimize terminal">
              _
            </button>
            <button
              type="button"
              className="term-light"
              onClick={() => setIsFullscreen((value) => !value)}
              aria-label={isFullscreen ? 'Restore window size' : 'Maximize window'}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? '=' : '[]'}
            </button>
            <button
              type="button"
              className="term-light"
              data-close
              onClick={closeTerminal}
              aria-label="Close terminal window"
            >
              X
            </button>
          </div>
        </div>

        <div className="term-toolbar">
          <span className="term-toolbar-label">Quick:</span>
          {['help', 'neofetch', 'projects', 'manga', 'cat about', 'cat contact', 'clear'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              className="term-chip"
              onClick={(event) => {
                event.stopPropagation();
                executeCommand(cmd);
              }}
            >
              {cmd}
            </button>
          ))}
        </div>

        <div ref={outputAreaRef} className="term-output">
          {history.map((entry) => (
            <div key={entry.id} className="term-entry">
              {entry.command ? (
                <div className="term-echo">
                  <Prompt />
                  <span>{entry.command}</span>
                </div>
              ) : null}
              {entry.output ? <div className="term-body">{entry.output}</div> : null}
            </div>
          ))}
        </div>

        <div className="term-inputrow">
          <Prompt />
          <div className="term-inputwrap">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(event) => setInputVal(event.target.value)}
              onKeyDown={handleKeyDown}
              className="term-input"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal command prompt input"
            />
            {suggestion && inputVal && suggestion.startsWith(inputVal) ? (
              <span className="term-suggestion" aria-hidden="true">
                <span className="term-suggestion-prefix">{inputVal}</span>
                <span>{suggestion.slice(inputVal.length)}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="term-status">
          <div className="term-status-left">
            <span className="term-status-key">UTF-8</span>
            <span>Shell: HuzbiSH</span>
            <span>Light: {theme}</span>
          </div>
          <div className="term-status-right">
            <span className="term-subtle">type &apos;exit&apos; to close</span>
            <span className="term-status-key" aria-hidden="true">&#8629;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
