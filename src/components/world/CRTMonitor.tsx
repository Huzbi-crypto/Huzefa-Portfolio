'use client';

import React, { useState, useEffect, useRef } from 'react';
import githubSnapshot from '@/data/github-snapshot.json';
import { projects } from '@/data/projects';
import { personalInfo } from '@/data/personal';
import { ExternalLink, Terminal, Star, Power, ChevronRight, ChevronLeft } from 'lucide-react';
import { GithubIcon } from '@/components/icons';

export type ScreenMode = 'IDLE' | 'GITHUB' | 'PROJECTS' | 'TERMINAL';

export interface CRTMonitorProps {
  initialMode?: ScreenMode;
  onActivity?: (action: 'typing' | 'idle') => void;
  className?: string;
  onSelectProject?: (projectId: string) => void;
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
}) => {
  const [mode, setMode] = useState<ScreenMode>(initialMode);
  const [isPoweredOn, setIsPoweredOn] = useState<boolean>(true);
  const [activeProjectIdx, setActiveProjectIdx] = useState<number>(0);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(7200);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalHistory, setTerminalHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'motd',
      output: "HuzbiOS v2.4 (tty1) - 2:00 AM workspace session.\nType 'help' for available commands.",
    },
  ]);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Scroll terminal container to bottom without scrolling the parent page window
  useEffect(() => {
    if (mode === 'TERMINAL' && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalHistory, mode]);

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
          <div className="space-y-1">
            <p className="text-accent font-bold">Available Commands:</p>
            <p><span className="text-accent-secondary">github</span>     - View repository statistics and live snapshot</p>
            <p><span className="text-accent-secondary">projects</span>   - List featured hardware cartridges & lab systems</p>
            <p><span className="text-accent-secondary">whoami</span>     - Display developer identity and credentials</p>
            <p><span className="text-accent-secondary">manga</span>      - Peek at Huzbi&apos;s current reading stack</p>
            <p><span className="text-accent-secondary">contact</span>    - Show email & social links</p>
            <p><span className="text-accent-secondary">uptime</span>     - Show session uptime and system load</p>
            <p><span className="text-accent-secondary">clear</span>      - Clear terminal console screen</p>
          </div>
        );
        break;

      case 'github':
        outputNode = (
          <div>
            <p className="text-accent font-bold">GitHub: {githubSnapshot.user.login} ({githubSnapshot.user.name})</p>
            <p>• Repositories: {githubSnapshot.stats.totalRepos}</p>
            <p>• Profile Stars: {githubSnapshot.stats.totalStarsGiven}</p>
            <p>• Followers: {githubSnapshot.stats.totalFollowers}</p>
            <p>• Top languages: Python, JavaScript, C++, HTML, CSS</p>
          </div>
        );
        break;

      case 'projects':
        outputNode = (
          <div className="space-y-1">
            <p className="text-accent font-bold">Featured Projects:</p>
            {projects.slice(0, 4).map((p, i) => (
              <p key={p.id}>
                [{i + 1}] <span className="text-fg font-semibold">{p.title}</span> ({p.visual.asciiBadge}) - {p.tagline.slice(0, 45)}...
              </p>
            ))}
            <p className="text-xs text-accent-cream mt-1">&gt; Tip: Use PROJECTS tab on monitor to inspect interactively.</p>
          </div>
        );
        break;

      case 'whoami':
        outputNode = `${personalInfo.name} (${personalInfo.legalName}) // ${personalInfo.title}\n"${personalInfo.bio}"\nLocation: ${personalInfo.location}`;
        break;

      case 'manga':
        outputNode = "Manga Favorites: One Piece, Naruto, Bleach, Black Clover, One Punch Man. Tech: SICP, Computer Networking.";
        break;

      case 'contact':
        outputNode = `Email: ${personalInfo.email}\nGitHub: ${personalInfo.socials.github}\nTwitter: ${personalInfo.socials.twitter}`;
        break;

      case 'uptime':
        outputNode = `Uptime: ${formatUptime(uptimeSeconds)} | Load Avg: 0.14, 0.08, 0.02 | 2 AM Quiet State`;
        break;

      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;

      case 'sudo':
      case 'sudo rm -rf /':
        outputNode = "Permission denied: chill out, this is a cozy room.";
        break;

      default:
        outputNode = `bash: command not found: '${cmd}'. Type 'help' for available commands.`;
    }

    setTerminalHistory((prev) => [...prev, { command: terminalInput, output: outputNode }]);
    setTerminalInput('');
  };

  const featuredProjects = projects.filter((p) => p.featured);
  const currentProject = featuredProjects[activeProjectIdx] || projects[0];

  const handleNextProject = () => {
    setActiveProjectIdx((prev) => (prev + 1) % featuredProjects.length);
  };

  const handlePrevProject = () => {
    setActiveProjectIdx((prev) => (prev - 1 + featuredProjects.length) % featuredProjects.length);
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* CRT MONITOR PHYSICAL CHASSIS / BEZEL */}
      <div className="relative w-full max-w-[460px] bg-[#1E2430] p-4 sm:p-5 rounded-2xl border-4 border-[#121620] shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] transition-all">
        
        {/* Top Vent Slots on Bezel */}
        <div className="flex justify-center gap-1.5 mb-2.5 opacity-40">
          <span className="w-10 h-1 bg-[#0A0D13] rounded-full" />
          <span className="w-10 h-1 bg-[#0A0D13] rounded-full" />
          <span className="w-10 h-1 bg-[#0A0D13] rounded-full" />
          <span className="w-10 h-1 bg-[#0A0D13] rounded-full" />
        </div>

        {/* INNER SCREEN RECESS */}
        <div className="relative bg-[#070A0F] rounded-xl p-2 sm:p-3 border-2 border-[#151A24] overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)]">
          
          {/* CRT Screen Curved Glow & Phosphor Container */}
          <div className="relative w-full aspect-[4/3] bg-bg-deep rounded-lg overflow-hidden border border-border/40 font-mono text-xs select-none">
            
            {/* Ambient CRT Scanlines & Vignette Layer */}
            <div className="absolute inset-0 crt-scanlines pointer-events-none z-20 opacity-60" />
            <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />

            {/* If Monitor is OFF */}
            {!isPoweredOn ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-fg-subtle bg-black">
                <div className="w-2 h-2 rounded-full bg-fg-subtle/30 animate-pulse mb-2" />
                <span className="text-[11px] tracking-wider">[CRT STANDBY]</span>
                <span className="text-[10px] text-fg-subtle/60 mt-1">Press PWR on bezel to wake</span>
              </div>
            ) : (
              /* SCREEN MODES */
              <div className="relative w-full h-full flex flex-col p-3 text-fg overflow-y-auto crt-glow">
                
                {/* Top Status Bar on CRT */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-[10px] text-accent/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="font-bold tracking-wider">HUZBI.SYS // {mode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-fg-muted">
                    <span>2:00 AM</span>
                    <span className="hidden sm:inline">UP: {formatUptime(uptimeSeconds).slice(0, 8)}</span>
                  </div>
                </div>

                {/* MODE 1: IDLE SCREEN */}
                {mode === 'IDLE' && (
                  <div className="flex-1 flex flex-col justify-between text-xs space-y-2">
                    <div className="space-y-1.5 leading-relaxed">
                      <p className="text-accent font-bold">
                        huzbi@room ~ $ status --all
                      </p>
                      <p className="text-fg-muted text-[11px]">
                        [SYSTEM] Environment: Karachi, PK (2 AM quiet mode)
                      </p>
                      <p className="text-fg-muted text-[11px]">
                        [KERNEL] FAST-NUCES CS graduate // Systems &amp; AI
                      </p>
                      <p className="text-fg-muted text-[11px]">
                        [FOCUS] LangGraph multi-agent &amp; network simulators
                      </p>
                      <p className="text-accent-secondary text-[11px] pt-1">
                        &gt; 38 public repos // 349 stars // reading One Piece
                      </p>
                    </div>

                    <div className="bg-bg-surface/80 p-2 rounded border border-border/60 text-[11px] space-y-1">
                      <div className="text-accent font-semibold flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>System Channels:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-fg-muted">
                        <span>• [GITHUB]: stats &amp; repos</span>
                        <span>• [PROJECTS]: quick viewer</span>
                        <span>• [TERMINAL]: bash prompt</span>
                        <span>• [PWR]: standby toggle</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-accent flex items-center gap-1 pt-1">
                      <span>huzbi@room ~ $</span>
                      <span className="w-2 h-3.5 bg-accent animate-pulse inline-block" />
                    </div>
                  </div>
                )}

                {/* MODE 2: GITHUB STATS */}
                {mode === 'GITHUB' && (
                  <div className="flex-1 flex flex-col justify-between text-xs space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-accent font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <GithubIcon className="w-3.5 h-3.5" />
                          github.com/{githubSnapshot.user.login}
                        </span>
                        <a
                          href={personalInfo.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5 text-[10px] text-accent-tertiary"
                        >
                          open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[10px] text-fg-muted italic line-clamp-1">
                        &ldquo;{githubSnapshot.user.bio}&rdquo;
                      </p>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 rounded bg-bg-surface border border-border/60">
                        <div className="text-accent font-bold text-sm">{githubSnapshot.stats.totalRepos}</div>
                        <div className="text-[9px] text-fg-muted">Repositories</div>
                      </div>
                      <div className="p-1.5 rounded bg-bg-surface border border-border/60">
                        <div className="text-accent-secondary font-bold text-sm">{githubSnapshot.stats.totalStarsGiven}</div>
                        <div className="text-[9px] text-fg-muted">Stars Given</div>
                      </div>
                      <div className="p-1.5 rounded bg-bg-surface border border-border/60">
                        <div className="text-accent-tertiary font-bold text-sm">{githubSnapshot.stats.totalFollowers}</div>
                        <div className="text-[9px] text-fg-muted">Followers</div>
                      </div>
                    </div>

                    {/* Language Breakdown */}
                    <div className="bg-bg-surface/70 p-1.5 rounded border border-border/50 text-[10px]">
                      <div className="text-fg-muted mb-1 flex items-center justify-between">
                        <span>Top Languages:</span>
                        <span className="text-accent-cream">Python (25.7%) / JS (22.9%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-bg-deep flex overflow-hidden">
                        <div className="bg-accent h-full" style={{ width: '26%' }} />
                        <div className="bg-accent-secondary h-full" style={{ width: '23%' }} />
                        <div className="bg-accent-tertiary h-full" style={{ width: '12%' }} />
                        <div className="bg-accent-cream h-full" style={{ width: '39%' }} />
                      </div>
                    </div>

                    <div className="text-[10px] text-fg-muted flex items-center justify-between">
                      <span>Recent: Computer-Networks-Sim</span>
                      <span className="text-accent font-mono">[ACTIVE]</span>
                    </div>
                  </div>
                )}

                {/* MODE 3: PROJECT ROTATING CAROUSEL */}
                {mode === 'PROJECTS' && (
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-bg-surface text-accent border border-border">
                          {currentProject.visual.asciiBadge} {activeProjectIdx + 1}/{featuredProjects.length}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-accent-secondary">
                          <Star className="w-3 h-3 fill-accent-secondary" />
                          <span>{currentProject.stars}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-fg text-sm line-clamp-1">
                        {currentProject.title}
                      </h4>
                      <p className="text-[10px] text-fg-muted line-clamp-2 mt-0.5">
                        {currentProject.tagline}
                      </p>
                    </div>

                    {/* Stack Badges */}
                    <div className="flex flex-wrap gap-1 my-1">
                      {currentProject.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-bg-surface text-fg-muted border border-border/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Controls & Links */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevProject}
                          className="p-1 rounded bg-bg-surface hover:bg-bg-hover text-accent border border-border"
                          title="Previous project"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextProject}
                          className="p-1 rounded bg-bg-surface hover:bg-bg-hover text-accent border border-border"
                          title="Next project"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectProject && (
                          <button
                            type="button"
                            onClick={() => onSelectProject(currentProject.id)}
                            className="text-accent underline font-mono"
                          >
                            Inspect
                          </button>
                        )}
                        <a
                          href={currentProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-accent text-bg font-bold flex items-center gap-1 hover:opacity-90"
                        >
                          <span>View Repo</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 4: INTERACTIVE MINI TERMINAL */}
                {mode === 'TERMINAL' && (
                  <div className="flex-1 flex flex-col justify-between text-xs overflow-hidden">
                    <div ref={terminalContainerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                      {terminalHistory.map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="text-accent flex items-center gap-1 font-mono">
                            <span>$</span>
                            <span className="text-fg">{item.command}</span>
                          </div>
                          <div className="text-fg-muted whitespace-pre-wrap pl-2 leading-relaxed">
                            {item.output}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Terminal Input Form with complete enclosed border and breathing room */}
                    <form
                      onSubmit={handleCommandSubmit}
                      className="mt-1.5 pt-1.5 pb-1 border-t border-border/50 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg-surface/90 border border-border focus-within:border-accent transition-colors">
                        <span className="text-accent font-mono font-bold shrink-0">&gt;</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={terminalInput}
                          onChange={(e) => {
                            setTerminalInput(e.target.value);
                            onActivity?.('typing');
                          }}
                          onBlur={() => onActivity?.('idle')}
                          placeholder="type help, projects, github..."
                          className="flex-1 bg-transparent text-fg placeholder:text-fg-subtle outline-none border-none focus:outline-none focus:ring-0 font-mono text-[11px] p-0"
                        />
                        <button
                          type="submit"
                          className="px-2 py-0.5 rounded bg-accent text-bg font-bold hover:opacity-90 text-[10px] tracking-wide shrink-0"
                        >
                          RUN
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CRT PHYSICAL BEZEL LOWER PANEL (Controls & Hardware Knobs) */}
        <div className="mt-3 flex items-center justify-between px-1 font-mono text-[10px] select-none">
          
          {/* Left Brand Badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-widest text-[#5A687D] text-[11px]">HUZBI-84</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D4757]" />
            <span className="text-[9px] text-[#4F5B6E]">NTSC // RGB</span>
          </div>

          {/* Center Mode Selector Buttons */}
          <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-md border border-[#27303F]">
            {(['IDLE', 'GITHUB', 'PROJECTS', 'TERMINAL'] as ScreenMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (!isPoweredOn) setIsPoweredOn(true);
                  if (m === 'TERMINAL') setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${
                  mode === m && isPoweredOn
                    ? 'bg-accent text-bg font-bold shadow-crt'
                    : 'text-[#8190A5] hover:text-fg'
                }`}
              >
                {m === 'TERMINAL' ? 'TERM' : m === 'PROJECTS' ? 'PROJ' : m}
              </button>
            ))}
          </div>

          {/* Right Power Switch & LED */}
          <div className="flex items-center gap-2">
            {/* Power LED Indicator */}
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                isPoweredOn
                  ? 'bg-[#33FF66] shadow-[0_0_8px_#33FF66]'
                  : 'bg-[#FF3333] shadow-[0_0_4px_#FF3333]'
              }`}
              title={isPoweredOn ? 'CRT Active' : 'Standby'}
            />

            {/* Power Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPoweredOn(!isPoweredOn)}
              className={`p-1 rounded-md border text-[9px] transition-all flex items-center gap-0.5 ${
                isPoweredOn
                  ? 'bg-[#151C27] text-accent border-[#2A374D] hover:border-accent'
                  : 'bg-[#221515] text-[#FF6666] border-[#4D2A2A]'
              }`}
              title="Toggle CRT Power"
            >
              <Power className="w-2.5 h-2.5" />
              <span>{isPoweredOn ? 'PWR' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monitor Base Stand (Physical retro pedestal) */}
      <div className="w-28 h-3 bg-[#171D27] border-x-2 border-b-2 border-[#0F131A] shadow-md" />
      <div className="w-40 h-2 bg-[#121620] rounded-b-md border border-[#0A0D13] shadow-lg" />
    </div>
  );
};
