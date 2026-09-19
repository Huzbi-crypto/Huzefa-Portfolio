'use client';

import React, { useState, useEffect, useRef } from 'react';
import githubSnapshot from '@/data/github-snapshot.json';
import { projects } from '@/data/projects';
import { personalInfo } from '@/data/personal';
import { ExternalLink, Star, ChevronRight, ChevronLeft, Maximize2, X } from 'lucide-react';
import { GithubIcon } from '@/components/icons';

export type ScreenMode = 'IDLE' | 'GITHUB' | 'PROJECTS' | 'TERMINAL';

export interface CRTMonitorProps {
  initialMode?: ScreenMode;
  onActivity?: (action: 'typing' | 'idle') => void;
  className?: string;
  onSelectProject?: (projectId: string) => void;
  onMonitorClick?: () => void;
}

interface CommandHistoryItem {
  command: string;
  output: string | React.ReactNode;
}

export const CRTMonitor: React.FC<CRTMonitorProps> = ({
  initialMode = 'IDLE',
  onActivity,
  className = '',
  onSelectProject,
  onMonitorClick,
}) => {
  const [mode, setMode] = useState<ScreenMode>(initialMode);
  const [isPoweredOn, setIsPoweredOn] = useState<boolean>(true);
  const [activeProjectIdx, setActiveProjectIdx] = useState<number>(0);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(7200);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [terminalHistory, setTerminalHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'motd',
      output: "HuzbiOS v2.4 (tty1) - 2:00 AM workspace session.\nType 'help' for available commands.",
    },
  ]);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const modalTerminalContainerRef = useRef<HTMLDivElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  // Uptime tick
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((u) => u + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format uptime
  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs}h ${mins}m ${s}s`;
  };

  // Scroll terminal container to bottom
  useEffect(() => {
    if (mode === 'TERMINAL') {
      if (terminalContainerRef.current) {
        terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
      }
      if (modalTerminalContainerRef.current) {
        modalTerminalContainerRef.current.scrollTop = modalTerminalContainerRef.current.scrollHeight;
      }
    }
  }, [terminalHistory, mode, isExpanded]);

  // Handle terminal command execution
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    onActivity?.('typing');
    setTimeout(() => onActivity?.('idle'), 1200);

    let outputNode: string | React.ReactNode = '';

    switch (cmd) {
      case 'help':
        outputNode = (
          <div className="space-y-0.5">
            <p className="text-accent font-bold">Available Commands:</p>
            <p><span className="text-accent-secondary">github</span>     - View repository statistics</p>
            <p><span className="text-accent-secondary">projects</span>   - List featured hardware cartridges</p>
            <p><span className="text-accent-secondary">whoami</span>     - Developer identity</p>
            <p><span className="text-accent-secondary">manga</span>      - Favorite manga stack</p>
            <p><span className="text-accent-secondary">contact</span>    - Show email &amp; social links</p>
            <p><span className="text-accent-secondary">uptime</span>     - Session uptime</p>
            <p><span className="text-accent-secondary">clear</span>      - Clear terminal screen</p>
          </div>
        );
        break;

      case 'github':
        outputNode = (
          <div>
            <p className="text-accent font-bold">GitHub: {githubSnapshot.user.login} ({githubSnapshot.user.name})</p>
            <p>• Repos: {githubSnapshot.stats.totalRepos} | Stars: {githubSnapshot.stats.totalStarsGiven} | Followers: {githubSnapshot.stats.totalFollowers}</p>
          </div>
        );
        break;

      case 'projects':
        outputNode = (
          <div className="space-y-0.5">
            <p className="text-accent font-bold">Featured Projects:</p>
            {projects.slice(0, 4).map((p, i) => (
              <p key={p.id}>
                [{i + 1}] <span className="text-fg font-semibold">{p.title}</span> - {p.tagline.slice(0, 36)}...
              </p>
            ))}
          </div>
        );
        break;

      case 'whoami':
        outputNode = `${personalInfo.name} (${personalInfo.legalName}) // ${personalInfo.title}\n"${personalInfo.bio}"`;
        break;

      case 'manga':
        outputNode = "Manga: One Piece, Naruto, Bleach, Black Clover, One Punch Man.";
        break;

      case 'contact':
        outputNode = `Email: ${personalInfo.email} | GitHub: ${personalInfo.socials.github}`;
        break;

      case 'uptime':
        outputNode = `Uptime: ${formatUptime(uptimeSeconds)} | 2 AM Quiet State`;
        break;

      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;

      default:
        outputNode = `Unknown: '${cmd}'. Type 'help'.`;
    }

    setTerminalHistory((prev) => [...prev, { command: terminalInput, output: outputNode }]);
    setTerminalInput('');
  };

  const featuredProjects = projects.filter((p) => p.featured);
  const currentProject = featuredProjects[activeProjectIdx] || projects[0];

  const handleNextProject = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveProjectIdx((prev) => (prev + 1) % featuredProjects.length);
  };

  const handlePrevProject = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveProjectIdx((prev) => (prev - 1 + featuredProjects.length) % featuredProjects.length);
  };

  return (
    <>
      {/* DESK-MOUNTED COMPACT RETRO CRT (Matching Reference Image) */}
      <div
        className={`relative flex flex-col items-center justify-between select-none ${className}`}
        onClick={() => {
          if (onMonitorClick) onMonitorClick();
        }}
      >
        {/* RETRO BEIGE / GREY HOUSING (90s Style) */}
        <div className="relative w-full h-[90%] bg-[#B8B0A2] rounded-md border-2 border-[#6D6559] shadow-md p-1 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Top Bezel Ventilation Slots */}
          <div className="flex justify-center gap-1 my-0.5 opacity-60">
            <span className="w-4 h-0.5 bg-[#4A4339] rounded-full" />
            <span className="w-4 h-0.5 bg-[#4A4339] rounded-full" />
            <span className="w-4 h-0.5 bg-[#4A4339] rounded-full" />
          </div>

          {/* INNER CRT TUBE SCREEN (Curved Dark Bezel) */}
          <div className="relative flex-1 bg-[#0A0E14] rounded border border-[#3E3830] overflow-hidden p-1 flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
            {/* Scanlines & CRT curvature effect */}
            <div className="absolute inset-0 crt-scanlines pointer-events-none z-20 opacity-40" />
            <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />

            {!isPoweredOn ? (
              <div className="flex-1 flex flex-col items-center justify-center text-fg-subtle">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mb-1 animate-pulse" />
                <span className="text-[7px] font-mono">[STANDBY]</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between font-mono text-[7px] text-accent leading-tight overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-accent/30 pb-0.5">
                  <span className="font-bold truncate">HUZBI.SYS // {mode}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    className="text-fg-muted hover:text-accent p-0.5"
                    title="Expand Full Terminal Screen"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Content by mode */}
                {mode === 'IDLE' && (
                  <div className="py-0.5 space-y-0.5">
                    <p className="text-[#F5E8C7] font-semibold">&gt; 02:14 AM SESSION</p>
                    <p className="text-fg-muted">Huzbi // Fullstack &amp; Systems</p>
                    <p className="text-accent-secondary truncate">38 Repos &bull; 349 Stars</p>
                    <p className="text-accent font-bold animate-pulse">&gt; SYS_OK _</p>
                  </div>
                )}

                {mode === 'GITHUB' && (
                  <div className="py-0.5 space-y-0.5">
                    <p className="text-[#F5E8C7] font-semibold truncate">@{githubSnapshot.user.login}</p>
                    <div className="flex justify-between text-fg-muted">
                      <span>Repos: {githubSnapshot.stats.totalRepos}</span>
                      <span>Stars: {githubSnapshot.stats.totalStarsGiven}</span>
                    </div>
                    <p className="text-accent-secondary truncate">Python, JS, C++</p>
                  </div>
                )}

                {mode === 'PROJECTS' && (
                  <div className="py-0.5">
                    <div className="flex items-center justify-between text-[#F5E8C7]">
                      <span className="truncate font-bold">{currentProject.title}</span>
                      <span className="text-[6px] text-accent-secondary">★ {currentProject.stars}</span>
                    </div>
                    <p className="text-fg-muted line-clamp-1">{currentProject.tagline}</p>
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handlePrevProject}
                          className="px-1 bg-black/40 text-accent rounded text-[6px]"
                        >
                          &lt;
                        </button>
                        <button
                          type="button"
                          onClick={handleNextProject}
                          className="px-1 bg-black/40 text-accent rounded text-[6px]"
                        >
                          &gt;
                        </button>
                      </div>
                      {onSelectProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(currentProject.id);
                          }}
                          className="text-accent underline text-[6px]"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {mode === 'TERMINAL' && (
                  <div className="py-0.5 flex flex-col justify-between h-full">
                    <div className="text-[6.5px] text-fg-muted line-clamp-2">
                      {terminalHistory.length > 0 ? (
                        <>
                          <span className="text-accent">$ {terminalHistory[terminalHistory.length - 1].command}</span>
                          <br />
                          {typeof terminalHistory[terminalHistory.length - 1].output === 'string'
                            ? terminalHistory[terminalHistory.length - 1].output
                            : 'Executed.'}
                        </>
                      ) : (
                        'Ready. Click [⤢] to type.'
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                      }}
                      className="mt-0.5 text-center text-accent underline text-[6.5px]"
                    >
                      [Open Interactive CLI ⤢]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOWER BEZEL BUTTONS (Authentic Retro Monitor Front) */}
          <div className="mt-0.5 flex items-center justify-between px-0.5 text-[6.5px] font-mono select-none">
            <span className="font-bold text-[#5A5043] tracking-wider">HUZBI-84</span>

            {/* Mode Mini-Tabs */}
            <div className="flex gap-0.5">
              {(['IDLE', 'GITHUB', 'PROJECTS', 'TERMINAL'] as ScreenMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode(m);
                    if (!isPoweredOn) setIsPoweredOn(true);
                  }}
                  className={`px-1 rounded-[1px] ${
                    mode === m && isPoweredOn
                      ? 'bg-accent text-bg font-bold'
                      : 'bg-[#9C9281] text-[#2E281F] hover:bg-[#857B6C]'
                  }`}
                >
                  {m === 'TERMINAL' ? 'CLI' : m === 'PROJECTS' ? 'PRJ' : m === 'GITHUB' ? 'GIT' : 'SYS'}
                </button>
              ))}
            </div>

            {/* Power LED & Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPoweredOn(!isPoweredOn);
              }}
              className="flex items-center gap-0.5 text-[#5A5043]"
              title="Power Toggle"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isPoweredOn ? 'bg-[#33FF66] shadow-[0_0_4px_#33FF66]' : 'bg-[#E53935]'
                }`}
              />
              <span className="text-[5.5px]">PWR</span>
            </button>
          </div>
        </div>

        {/* PEDESTAL MONITOR STAND (Resting on Desk Surface) */}
        <div className="w-12 h-1.5 bg-[#8C8375] border-x border-[#5A5043]" />
        <div className="w-20 h-1.5 bg-[#6D6559] rounded-b-[2px] shadow-sm border border-[#4A4339]" />
      </div>

      {/* FULLSCREEN / MODAL EXPANDED VIEW WHEN CLICKED */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#1E2430] p-5 sm:p-6 rounded-2xl border-4 border-[#121620] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-crt" />
                <span className="font-mono text-sm font-bold text-accent">HUZBI-84 // CRT WORKSTATION</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg bg-bg-surface text-fg-muted hover:text-fg border border-border transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inner Monitor Bezel */}
            <div className="relative bg-[#070A0F] rounded-xl p-4 border-2 border-[#151A24] overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] min-h-[360px] max-h-[70vh] flex flex-col">
              <div className="absolute inset-0 crt-scanlines pointer-events-none z-20 opacity-50" />
              <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />

              {/* Mode Bar */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50 font-mono text-xs text-accent">
                <span>MODE: {mode}</span>
                <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
              </div>

              {/* Mode Content */}
              <div className="flex-1 overflow-y-auto font-mono z-10">
                {mode === 'IDLE' && (
                  <div className="space-y-3 text-sm">
                    <p className="text-accent font-bold">&gt; system.status</p>
                    <p className="text-fg-muted">Huzbi // 2 AM Creative Lab</p>
                    <p className="text-fg-muted">Location: Karachi, PK</p>
                    <p className="text-fg-muted">Degree: BS Computer Science, FAST-NUCES</p>
                    <p className="text-accent-secondary">38 Public Repositories &bull; 349 Stars</p>
                    <div className="p-3 bg-bg-surface/80 rounded border border-border mt-4 text-xs text-fg-muted">
                      Switch to <strong className="text-accent">TERMINAL</strong> to type commands, or <strong className="text-accent">PROJECTS</strong> to inspect featured builds.
                    </div>
                  </div>
                )}

                {mode === 'GITHUB' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GithubIcon className="w-5 h-5 text-accent" />
                        <span className="text-base font-bold text-fg">{githubSnapshot.user.login}</span>
                      </div>
                      <a
                        href={personalInfo.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-accent text-bg font-bold rounded flex items-center gap-1.5 text-xs hover:opacity-90"
                      >
                        Visit Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-bg-surface rounded border border-border">
                        <div className="text-2xl font-bold text-accent">{githubSnapshot.stats.totalRepos}</div>
                        <div className="text-xs text-fg-muted">Repositories</div>
                      </div>
                      <div className="p-3 bg-bg-surface rounded border border-border">
                        <div className="text-2xl font-bold text-accent-secondary">{githubSnapshot.stats.totalStarsGiven}</div>
                        <div className="text-xs text-fg-muted">Stars Given</div>
                      </div>
                      <div className="p-3 bg-bg-surface rounded border border-border">
                        <div className="text-2xl font-bold text-accent-tertiary">{githubSnapshot.stats.totalFollowers}</div>
                        <div className="text-xs text-fg-muted">Followers</div>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'PROJECTS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-bg-surface text-accent border border-border">
                        {currentProject.visual.asciiBadge} ({activeProjectIdx + 1} of {featuredProjects.length})
                      </span>
                      <div className="flex items-center gap-1 text-accent-secondary text-sm">
                        <Star className="w-4 h-4 fill-accent-secondary" />
                        <span>{currentProject.stars} stars</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-fg">{currentProject.title}</h3>
                    <p className="text-sm text-fg-muted">{currentProject.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {currentProject.techStack.map((tech) => (
                        <span key={tech} className="text-xs px-2 py-0.5 rounded bg-bg-surface text-fg-muted border border-border">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handlePrevProject}
                          className="px-3 py-1 rounded bg-bg-surface hover:bg-bg-hover text-accent border border-border flex items-center gap-1 text-xs"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={handleNextProject}
                          className="px-3 py-1 rounded bg-bg-surface hover:bg-bg-hover text-accent border border-border flex items-center gap-1 text-xs"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        {onSelectProject && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(currentProject.id);
                              setIsExpanded(false);
                            }}
                            className="text-accent underline text-xs font-mono"
                          >
                            Open Details
                          </button>
                        )}
                        <a
                          href={currentProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded bg-accent text-bg font-bold flex items-center gap-1 text-xs hover:opacity-90"
                        >
                          <span>View Code</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'TERMINAL' && (
                  <div className="flex flex-col h-[280px] justify-between">
                    <div ref={modalTerminalContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2 text-xs">
                      {terminalHistory.map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="text-accent flex items-center gap-1">
                            <span>huzbi@room:~$</span>
                            <span className="text-fg">{item.command}</span>
                          </div>
                          <div className="text-fg-muted whitespace-pre-wrap pl-3">{item.output}</div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleCommandSubmit} className="mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg-surface border border-border focus-within:border-accent">
                        <span className="text-accent font-bold">&gt;</span>
                        <input
                          ref={modalInputRef}
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          placeholder="Type 'help', 'projects', 'github', 'manga'..."
                          className="flex-1 bg-transparent text-fg placeholder:text-fg-subtle outline-none text-xs"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-accent text-bg font-bold text-xs hover:opacity-90"
                        >
                          Execute
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(['IDLE', 'GITHUB', 'PROJECTS', 'TERMINAL'] as ScreenMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      mode === m
                        ? 'bg-accent text-bg font-bold shadow-crt'
                        : 'text-fg-muted hover:text-fg bg-bg-surface border border-border'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1 rounded bg-bg-surface text-fg-muted hover:text-fg border border-border text-xs font-mono"
              >
                Return to Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
