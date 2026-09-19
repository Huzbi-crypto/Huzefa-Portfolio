'use client';

import React, { useState } from 'react';
import type { Project, VisualArtifactKind } from '@/types/portfolio';
import {
  ExternalLink,
  Flame,
  Star,
  Cpu,
  Terminal,
  Network,
  Sparkles,
  Palette,
  Binary,
  Workflow,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons';

interface ProjectArtifactProps {
  project: Project;
  onInspect?: (project: Project) => void;
  priority?: boolean;
}

export function ProjectArtifact({ project, onInspect }: ProjectArtifactProps) {
  const [isHovered, setIsHovered] = useState(false);
  const visualType = project.visual.type;
  const accentColor = project.visual.accentColor || '#A8D672';

  const handleCardClick = (e: React.MouseEvent) => {
    // If click was on an anchor tag, don't trigger inspection
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      return;
    }
    if (onInspect) {
      onInspect(project);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onInspect) {
        onInspect(project);
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer select-none text-left"
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0px)',
      }}
    >
      {/* Visual Artifact Wrapper with Physical Hardware Aesthetics */}
      <div
        className="relative w-full rounded-xl overflow-hidden border transition-all duration-300 bg-bg-surface flex flex-col justify-between"
        style={{
          borderColor: isHovered ? accentColor : 'var(--color-border)',
          boxShadow: isHovered
            ? `0 10px 28px -6px ${accentColor}25, 0 0 16px -2px ${accentColor}18`
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* 1. PHYSICAL HARDWARE HEADER / CHASSIS TOP */}
        <HardwareHeader type={visualType} accentColor={accentColor} isHovered={isHovered} />

        {/* 2. ARTIFACT SPECIFIC VISUAL BODY */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          {/* Top meta: Badge & Stars */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-xs font-semibold uppercase tracking-wider border shadow-sm"
                style={{
                  backgroundColor: `${accentColor}12`,
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                <span>{project.visual.asciiBadge}</span>
                <span>{project.visual.label}</span>
              </span>

              <div className="flex items-center gap-2">
                {project.stars > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium border"
                    style={{
                      backgroundColor: 'rgba(230, 161, 92, 0.12)',
                      borderColor: 'rgba(230, 161, 92, 0.35)',
                      color: 'var(--color-accent-secondary)',
                    }}
                    title={`${project.stars} GitHub Stars`}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>{project.stars}</span>
                  </span>
                )}
                {project.featured && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-accent">
                    <Flame className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>
            </div>

            {/* Title & Tagline */}
            <h3 className="text-base sm:text-lg font-bold text-fg group-hover:text-accent transition-colors flex items-center gap-2">
              <span>{project.title}</span>
            </h3>

            <p className="text-xs text-fg-muted mt-2 line-clamp-2 leading-relaxed font-sans">
              {project.tagline || project.description}
            </p>

            {/* Middle Artifact Schematic Display */}
            <ArtifactSchematic
              type={visualType}
              project={project}
              accentColor={accentColor}
              isHovered={isHovered}
            />
          </div>

          {/* Languages & Tech Pills */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.languages.map((lang) => (
                <span
                  key={lang}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-deep border border-border/80 text-fg"
                >
                  {lang}
                </span>
              ))}
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface text-fg-muted border border-border/40"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="text-[10px] font-mono px-1 py-0.5 text-fg-subtle">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <div className="flex items-center gap-2">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-bg-deep hover:bg-bg-hover text-fg-muted hover:text-accent border border-border transition-colors"
                  title="View repository on GitHub"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>Source</span>
                </a>

                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-accent hover:underline"
                    title="Open live deployment"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Inspect Prompt */}
              <span className="inline-flex items-center gap-1 text-[11px] text-fg-subtle group-hover:text-accent transition-colors font-mono">
                <span>Inspect</span>
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. PHYSICAL HARDWARE FOOTER / CONNECTOR BASE */}
        <HardwareFooter type={visualType} accentColor={accentColor} isHovered={isHovered} />
      </div>
    </div>
  );
}

/**
 * Top chassis styling based on artifact type
 */
function HardwareHeader({
  type,
  accentColor,
  isHovered,
}: {
  type: VisualArtifactKind;
  accentColor: string;
  isHovered: boolean;
}) {
  switch (type) {
    case 'cartridge':
      // Retro ROM Cartridge Notch & Grip Ribs
      return (
        <div className="w-full bg-bg-deep border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-border" />
            <span className="text-[10px] font-mono tracking-widest text-fg-muted uppercase">
              ROM // CARTRIDGE
            </span>
          </div>
          {/* Grip ribs */}
          <div className="flex gap-1">
            <span className="w-4 h-1 bg-border/80 rounded-sm" />
            <span className="w-4 h-1 bg-border/80 rounded-sm" />
            <span className="w-4 h-1 bg-border/80 rounded-sm" />
          </div>
        </div>
      );

    case 'terminal':
      // Retro Serial Terminal Monitor Bezel & LEDs
      return (
        <div className="w-full bg-bg-deep border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-mono tracking-wider text-fg-muted uppercase">
              TTY1 CONSOLE // 9600 BAUD
            </span>
          </div>
          {/* Hardware LEDs */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isHovered ? '#A8D672' : '#456627',
                boxShadow: isHovered ? '0 0 6px #A8D672' : 'none',
              }}
              title="PWR"
            />
            <span
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isHovered ? '#E6A15C' : '#5C3E20',
                boxShadow: isHovered ? '0 0 6px #E6A15C' : 'none',
              }}
              title="TX/RX"
            />
          </div>
        </div>
      );

    case 'network':
      // Network PCB Routing Motherboard Silkscreen
      return (
        <div className="w-full bg-[#0D151E] border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-accent-tertiary" />
            <span className="text-[10px] font-mono tracking-wider text-[#7FB8D9] uppercase">
              PCB // ROUTER BUS TOPOLOGY
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-fg-subtle">
            <span>[ETH0/1]</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isHovered ? '#7FB8D9' : '#2A4456',
                boxShadow: isHovered ? '0 0 5px #7FB8D9' : 'none',
              }}
            />
          </div>
        </div>
      );

    case 'machine':
      // Neural Accelerator / Diffusion Engine Rack Unit
      return (
        <div className="w-full bg-bg-deep border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            <span className="text-[10px] font-mono tracking-wider text-accent-secondary uppercase">
              NEURAL ACCELERATOR // DIFFUSION
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isHovered ? accentColor : `${accentColor}55`,
                boxShadow: isHovered ? `0 0 6px ${accentColor}` : 'none',
              }}
            />
            <span className="text-[10px] font-mono text-fg-subtle">STABLE</span>
          </div>
        </div>
      );

    case 'module':
      // Agentic Execution Module
      return (
        <div className="w-full bg-bg-deep border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-3.5 h-3.5 text-[#A79BFF]" />
            <span className="text-[10px] font-mono tracking-wider text-[#A79BFF] uppercase">
              AGENTIC PIPELINE // GRAPH
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-fg-muted">BUS: ACTIVE</span>
          </div>
        </div>
      );

    case 'canvas':
    default:
      return (
        <div className="w-full bg-bg-deep border-b border-border/80 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-[#73B7FF]" />
            <span className="text-[10px] font-mono tracking-wider text-[#73B7FF] uppercase">
              VECTOR CANVAS // 60 FPS
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-fg-muted">
            <span>[X, Y, ΔT]</span>
          </div>
        </div>
      );
  }
}

/**
 * Mid-card schematic preview illustrating the physical machine
 */
function ArtifactSchematic({
  type,
  project,
  accentColor,
  isHovered,
}: {
  type: VisualArtifactKind;
  project: Project;
  accentColor: string;
  isHovered: boolean;
}) {
  switch (type) {
    case 'cartridge':
      return (
        <div className="mt-3 p-2.5 rounded bg-bg-deep/90 border border-border/60 font-mono text-[11px] text-fg-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Binary className="w-3.5 h-3.5 text-accent" />
            <span className="text-fg-subtle">ROM CHECKSUM:</span>
            <span className="text-fg">0x{project.id.slice(0, 4).toUpperCase()}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface border border-border/40 text-fg-muted">
            NAND FLASH
          </span>
        </div>
      );

    case 'terminal':
      return (
        <div className="mt-3 p-2.5 rounded bg-[#080B10] border border-border/70 font-mono text-[11px] relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-accent">
            <span className="text-accent-secondary">&gt;</span>
            <span className="text-fg-muted">run</span>
            <span className="text-fg">{project.slug}.bin</span>
            <span
              className={`inline-block w-1.5 h-3 bg-accent ${
                isHovered ? 'animate-pulse' : 'opacity-60'
              }`}
            />
          </div>
          <div className="text-[10px] text-fg-subtle mt-1 truncate">
            stdout: {project.highlights?.[0] || 'Ready for interaction'}
          </div>
        </div>
      );

    case 'network':
      return (
        <div className="mt-3 p-2.5 rounded bg-[#0A1118] border border-[#1B2A38] font-mono text-[11px]">
          <div className="flex items-center justify-between text-[#7FB8D9] mb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FB8D9]" />
              Dijkstra SPF
            </span>
            <span className="text-fg-subtle text-[10px]">TOPOLOGY: CONVERGED</span>
          </div>
          <div className="text-[10px] text-fg-muted flex items-center gap-2">
            <span>(Node A) ──[cost: 2]── (Node B) ──[cost: 1]── (Node C)</span>
          </div>
        </div>
      );

    case 'machine':
      return (
        <div className="mt-3 p-2.5 rounded bg-bg-deep/90 border border-border/70 font-mono text-[11px]">
          <div className="flex items-center justify-between text-accent-secondary mb-1">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3" />
              <span>SAMPLER: DPM++ 2M Karras</span>
            </span>
            <span className="text-[10px] text-fg-muted">CFG: 7.5</span>
          </div>
          {/* Animated wave/dial simulation */}
          <div className="w-full bg-bg-surface h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: isHovered ? '92%' : '75%',
                backgroundColor: accentColor,
              }}
            />
          </div>
        </div>
      );

    case 'module':
      return (
        <div className="mt-3 p-2.5 rounded bg-bg-deep/90 border border-border/70 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[#A79BFF] mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>StateGraph Pipeline</span>
            </span>
            <span className="text-[10px] text-fg-subtle">RECURSION: OK</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-fg-muted">
            <span className="px-1 py-0.5 rounded bg-bg-surface border border-border/40">Query</span>
            <span>➔</span>
            <span className="px-1 py-0.5 rounded bg-bg-surface border border-border/40">RAG</span>
            <span>➔</span>
            <span className="px-1 py-0.5 rounded bg-bg-surface border border-border/40">Tools</span>
          </div>
        </div>
      );

    case 'canvas':
    default:
      return (
        <div className="mt-3 p-2.5 rounded bg-bg-deep/90 border border-border/70 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[#73B7FF] mb-1">
            <span>PARTICLES: 1,024</span>
            <span className="text-[10px] text-fg-subtle">NEWTONIAN GRAVITY</span>
          </div>
          <div className="text-[10px] text-fg-muted truncate">
            Interactive cursor displacement &amp; velocity fields
          </div>
        </div>
      );
  }
}

/**
 * Bottom hardware footer / connection pins
 */
function HardwareFooter({
  type,
  accentColor,
  isHovered,
}: {
  type: VisualArtifactKind;
  accentColor: string;
  isHovered: boolean;
}) {
  if (type === 'cartridge') {
    // Golden ROM edge connector pins
    return (
      <div className="w-full bg-bg-deep border-t border-border/80 px-4 py-1.5 flex items-center justify-center">
        <div className="flex gap-1 sm:gap-1.5 opacity-80">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 sm:w-2 h-3 rounded-t-sm transition-colors duration-200"
              style={{
                backgroundColor: isHovered ? '#E6A15C' : '#9E6D38',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'network') {
    return (
      <div className="w-full bg-[#0D151E] border-t border-border/80 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-fg-subtle">
        <span>TX/RX 1000BASE-T</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7FB8D9]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8D672]" />
        </div>
      </div>
    );
  }

  // Default subtle hardware border line
  return (
    <div
      className="w-full h-1 transition-all duration-300"
      style={{
        backgroundColor: isHovered ? accentColor : 'transparent',
      }}
    />
  );
}
