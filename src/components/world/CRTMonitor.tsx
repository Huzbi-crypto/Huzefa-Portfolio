'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState<boolean>(false);
  const [terminalHistory, setTerminalHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'motd',
      output: "HuzbiOS v2.4 (tty1) - 2:00 AM workspace session.\nType 'help' for available commands.",
    },
  ]);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const modalTerminalContainerRef = useRef<HTMLDivElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  // Client-side mount flag for React portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle modal escape key and lock body scroll when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  // Focus modal input when expanded in terminal mode
  useEffect(() => {
    if (isExpanded && mode === 'TERMINAL') {
      const timer = setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, mode]);

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
        {/* RETRO BEIGE / GREY HOUSING (Authentic 3D Beveled 90s CRT Chassis) */}
        <div className="relative w-full h-[88%] bg-gradient-to-b from-[#C5BCAD] via-[#B5AB9B] to-[#9C9281] rounded-lg border-t-[3px] border-t-[#DDD5C7] border-l-[3px] border-l-[#C2B9AA] border-r-[3px] border-r-[#7D7363] border-b-[4px] border-b-[#5E5547] shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.4)] p-1.5 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle Top Bezel Ventilation Slots & Recessed Trim */}
          <div className="flex justify-between items-center px-1 mb-1 opacity-70">
            <div className="flex gap-1">
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
            </div>
            <span className="text-[5.5px] font-mono tracking-widest text-[#524B40] font-bold">TRINITRON // 14&quot;</span>
            <div className="flex gap-1">
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
              <span className="w-3.5 h-0.5 bg-[#4A4339] rounded-full shadow-inner" />
            </div>
          </div>

          {/* INNER CRT TUBE BEZEL (Recessed Chamfered Surround) */}
          <div className="relative flex-1 bg-[#1A1612] rounded-[6px] border-2 border-[#120F0C] p-1 flex flex-col justify-between shadow-[inset_0_4px_10px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,255,255,0.2)]">
            
            {/* Cathode Ray Tube Screen (Bulbous Glass Face) */}
            <div className="relative flex-1 bg-[#06090E] rounded-[4px] border border-[#26211B] overflow-hidden p-1.5 flex flex-col justify-between shadow-[inset_0_0_14px_rgba(0,0,0,0.95)]">
              {/* Scanlines & Curvature & Glare reflection */}
              <div className="absolute inset-0 crt-scanlines pointer-events-none z-20 opacity-45" />
              <div className="absolute inset-0 crt-vignette pointer-events-none z-20 opacity-70" />
              {/* Diagonal Glass Sheen Reflection Arc */}
              <div
                className="absolute inset-0 pointer-events-none z-20 opacity-25"
                style={{
                  background: 'linear-gradient(130deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.04) 28%, transparent 45%)',
                }}
              />

              {!isPoweredOn ? (
                <div className="flex-1 flex flex-col items-center justify-center text-fg-subtle">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mb-1 animate-pulse" />
                  <span className="text-[7px] font-mono">[STANDBY]</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between font-mono text-[7px] text-accent leading-tight overflow-hidden relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-accent/30 pb-0.5">
                    <span className="font-bold truncate text-[#A8D672]">HUZBI.SYS // {mode}</span>
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
          </div>

          {/* LOWER BEZEL HARDWARE CONTROLS (Dials, Mode Buttons, Speaker Louvers, Power Switch) */}
          <div className="mt-1 flex items-center justify-between px-1 text-[6.5px] font-mono select-none bg-[#A89E8E] rounded py-0.5 border-t border-[#C0B7A8] shadow-inner">
            {/* Vintage Rotary Dials (Brightness & Contrast) */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5" title="Brightness Dial">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4A4237] border border-[#2E2820] shadow-sm flex items-center justify-center relative">
                  <div className="w-0.5 h-1 bg-white/70 absolute top-0.5" />
                </div>
                <span className="text-[5px] text-[#4A4237] font-bold">BRT</span>
              </div>
              <div className="flex items-center gap-0.5" title="Contrast Dial">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4A4237] border border-[#2E2820] shadow-sm flex items-center justify-center relative">
                  <div className="w-0.5 h-1 bg-white/70 absolute top-0.5 rotate-45" />
                </div>
                <span className="text-[5px] text-[#4A4237] font-bold">CON</span>
              </div>
            </div>

            {/* Mode Mechanical Push-Buttons */}
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
                  className={`px-1 py-0.5 rounded-[1px] text-[6px] border ${
                    mode === m && isPoweredOn
                      ? 'bg-accent text-bg font-bold border-accent shadow-sm'
                      : 'bg-[#7D7364] text-[#F0EBE1] border-[#5E5548] hover:bg-[#6B6254]'
                  }`}
                >
                  {m === 'TERMINAL' ? 'CLI' : m === 'PROJECTS' ? 'PRJ' : m === 'GITHUB' ? 'GIT' : 'SYS'}
                </button>
              ))}
            </div>

            {/* Power Rocker Switch & Green Phosphor LED */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPoweredOn(!isPoweredOn);
              }}
              className="flex items-center gap-1 text-[#4A4237] hover:opacity-80"
              title="Power Toggle"
            >
              <div
                className={`w-2 h-2 rounded-full border border-black/40 transition-shadow ${
                  isPoweredOn ? 'bg-[#22C55E] shadow-[0_0_6px_#22C55E]' : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[5.5px] font-bold">PWR</span>
            </button>
          </div>
        </div>

        {/* 3D FLARED SWIVEL PEDESTAL STAND (Anchored Sturdily to Desk Surface) */}
        <div className="w-14 h-2 bg-gradient-to-b from-[#7A7161] to-[#5A5245] border-x-2 border-[#423C32] relative flex items-center justify-center shadow-inner">
          <div className="w-8 h-0.5 bg-[#3D372E] rounded-full" />
        </div>
        <div className="w-28 h-2.5 bg-gradient-to-b from-[#8C8272] via-[#756B5C] to-[#554E41] rounded-b-md shadow-lg border-2 border-t-0 border-[#3D372E] flex justify-between items-center px-2">
          <div className="w-3 h-1 bg-[#3A342B] rounded-xs" />
          <div className="w-3 h-1 bg-[#3A342B] rounded-xs" />
        </div>
      </div>

      {/* FULLSCREEN / MODAL EXPANDED VIEW WHEN CLICKED (Mounted via React Portal directly to document.body) */}
      {mounted && isExpanded && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-auto animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="CRT Terminal Workstation"
        >
          <div
            className="relative w-full max-w-3xl bg-[#1E2430] p-5 sm:p-6 rounded-2xl border-4 border-[#121620] shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-crt" />
                <span className="font-mono text-sm font-bold text-accent">HUZBI-84 // CRT WORKSTATION</span>
                <span className="text-[11px] font-mono text-fg-muted hidden sm:inline">(Press ESC to return)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg bg-bg-surface text-fg-muted hover:text-fg border border-border transition-colors hover:border-accent"
                  title="Close (ESC)"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inner Monitor Bezel */}
            <div className="relative bg-[#070A0F] rounded-xl p-4 sm:p-5 border-2 border-[#151A24] overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] min-h-[360px] max-h-[70vh] flex flex-col">
              <div className="absolute inset-0 crt-scanlines pointer-events-none z-20 opacity-50" />
              <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />

              {/* Mode Bar */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50 font-mono text-xs text-accent">
                <span>MODE: {mode}</span>
                <span>UPTIME: {formatUptime(uptimeSeconds)}</span>
              </div>

              {/* Mode Content */}
              <div className="flex-1 overflow-y-auto font-mono z-10 custom-scrollbar pr-1">
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
                className="px-3 py-1 rounded bg-bg-surface text-fg-muted hover:text-fg border border-border text-xs font-mono hover:border-accent"
              >
                Return to Room
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
