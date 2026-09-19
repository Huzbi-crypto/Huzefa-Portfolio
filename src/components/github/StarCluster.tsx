'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { GitHubRepo } from '@/types/github';
import { Star, Sparkles, ExternalLink, X } from 'lucide-react';

interface StarClusterProps {
  repositories: GitHubRepo[];
}

interface ConstellationNode {
  repo: GitHubRepo;
  x: number; // 0 - 900
  y: number; // 0 - 450
  radius: number;
  glowRadius: number;
  color: string;
  cluster: 'ai-web' | 'systems' | 'creative' | 'misc';
}

interface ConstellationLine {
  source: ConstellationNode;
  target: ConstellationNode;
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#7FB8D9',
  JavaScript: '#E6A15C',
  'C++': '#A8D672',
  C: '#D6AE62',
  HTML: '#E48873',
  CSS: '#A79BFF',
  Java: '#D9825B',
  default: '#8C929D',
};

// Background twinkling stars
const AMBIENT_STARS = Array.from({ length: 70 }).map((_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 890) + 5,
  y: ((i * 59 + 29) % 440) + 5,
  size: (i % 3) * 0.6 + 0.8,
  opacity: (i % 5) * 0.15 + 0.2,
  duration: ((i % 4) + 2) + 's',
}));

export function StarCluster({ repositories }: StarClusterProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<ConstellationNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  // Escape key listener to clear selected star
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Filter repos and position them in celestial coordinates
  const { nodes, lines } = useMemo(() => {
    // Sort starred repos first, then notable ones
    const starredRepos = repositories
      .filter((r) => !r.fork)
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));

    // Curate up to 24 stellar bodies
    const targetRepos = starredRepos.slice(0, 24);

    // Coordinate mapping designed for aesthetically spaced clusters
    const clusterPositions: Record<string, { xRange: [number, number]; yRange: [number, number] }> = {
      'ai-web': { xRange: [80, 420], yRange: [60, 220] },
      systems: { xRange: [480, 820], yRange: [70, 240] },
      creative: { xRange: [120, 450], yRange: [250, 400] },
      misc: { xRange: [500, 820], yRange: [260, 400] },
    };

    const nodeList: ConstellationNode[] = [];

    targetRepos.forEach((repo, idx) => {
      let cluster: 'ai-web' | 'systems' | 'creative' | 'misc' = 'misc';
      const lang = repo.language || '';
      const name = repo.name.toLowerCase();

      if (
        name.includes('anime') ||
        name.includes('bard') ||
        name.includes('lang') ||
        name.includes('ai') ||
        name.includes('manga')
      ) {
        cluster = 'ai-web';
      } else if (
        lang === 'C++' ||
        lang === 'C' ||
        lang === 'Java' ||
        name.includes('routing') ||
        name.includes('compiler') ||
        name.includes('dsa')
      ) {
        cluster = 'systems';
      } else if (
        name.includes('term') ||
        name.includes('creative') ||
        name.includes('ascii') ||
        name.includes('visualizer')
      ) {
        cluster = 'creative';
      }

      // Star magnitude based on stars received
      const stars = repo.stargazers_count || 0;
      let radius = 4;
      let glowRadius = 8;
      if (stars >= 5) {
        radius = 9;
        glowRadius = 24;
      } else if (stars >= 2) {
        radius = 6.5;
        glowRadius = 16;
      } else if (stars >= 1) {
        radius = 5;
        glowRadius = 12;
      }

      const color = LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default;

      // Deterministic spread inside cluster box
      const box = clusterPositions[cluster];
      const subIdx = idx % 6;
      const xSpread = (subIdx / 5) * (box.xRange[1] - box.xRange[0]);
      const ySpread = ((idx * 7) % 5 / 4) * (box.yRange[1] - box.yRange[0]);

      // Specific highlight positions for the prominent stars
      let finalX = box.xRange[0] + xSpread;
      let finalY = box.yRange[0] + ySpread;

      if (repo.name === 'aiAnime-ImageGenerator-site') {
        finalX = 250;
        finalY = 120;
      } else if (repo.name === 'FAST-NU-Karachi-Batch-2024') {
        finalX = 640;
        finalY = 110;
      } else if (repo.name === 'Term-Experience') {
        finalX = 280;
        finalY = 320;
      } else if (repo.name === 'Computer-Networks-Routing-Simulation') {
        finalX = 580;
        finalY = 210;
      } else if (repo.name === 'GoogleBard-site') {
        finalX = 140;
        finalY = 180;
      }

      nodeList.push({
        repo,
        x: Math.round(finalX),
        y: Math.round(finalY),
        radius,
        glowRadius,
        color,
        cluster,
      });
    });

    // Generate constellation lines between closely related nodes in same cluster
    const lineList: ConstellationLine[] = [];
    const clusterMap: Record<string, ConstellationNode[]> = {
      'ai-web': [],
      systems: [],
      creative: [],
      misc: [],
    };

    nodeList.forEach((n) => {
      clusterMap[n.cluster].push(n);
    });

    Object.values(clusterMap).forEach((group) => {
      for (let i = 0; i < group.length - 1; i++) {
        // Connect to nearest neighbor
        const source = group[i];
        const target = group[i + 1];
        lineList.push({ source, target });
      }
    });

    return { nodes: nodeList, lines: lineList };
  }, [repositories]);

  // Filter nodes based on selected filter
  const visibleNodes = useMemo(() => {
    if (selectedCluster === 'all') return nodes;
    if (selectedCluster === 'starred') return nodes.filter((n) => n.repo.stargazers_count > 0);
    return nodes.filter((n) => n.cluster === selectedCluster);
  }, [nodes, selectedCluster]);

  const activeNode = hoveredNode || selectedNode;

  return (
    <div className="rounded-xl bg-bg-surface border border-border p-5 sm:p-6 shadow-subtle relative overflow-hidden">
      {/* Constellation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CELESTIAL MAP // STAR CLUSTER HUD</span>
          </div>
          <h3 className="text-lg font-bold text-fg">
            Repository Constellation &amp; Radiant Stars
          </h3>
          <p className="text-xs text-fg-muted font-sans mt-0.5">
            Celestial map where star magnitude corresponds to repository stargazers.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedCluster('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCluster === 'all'
                ? 'bg-accent text-bg font-bold shadow-crt'
                : 'bg-bg-deep text-fg-muted hover:text-fg border border-border'
            }`}
          >
            All Stars
          </button>
          <button
            type="button"
            onClick={() => setSelectedCluster('starred')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              selectedCluster === 'starred'
                ? 'bg-accent text-bg font-bold shadow-crt'
                : 'bg-bg-deep text-fg-muted hover:text-fg border border-border'
            }`}
          >
            <Star className="w-3 h-3 fill-current text-accent-secondary" />
            <span>Starred (&gt;0)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCluster('ai-web')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCluster === 'ai-web'
                ? 'bg-accent text-bg font-bold shadow-crt'
                : 'bg-bg-deep text-fg-muted hover:text-fg border border-border'
            }`}
          >
            AI Nebula
          </button>
          <button
            type="button"
            onClick={() => setSelectedCluster('systems')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedCluster === 'systems'
                ? 'bg-accent text-bg font-bold shadow-crt'
                : 'bg-bg-deep text-fg-muted hover:text-fg border border-border'
            }`}
          >
            Systems Cluster
          </button>
        </div>
      </div>

      {/* SVG Interactive Constellation Canvas */}
      <div
        onClick={() => setSelectedNode(null)}
        className="relative w-full aspect-[2/1] min-h-[280px] sm:min-h-[380px] bg-[#070A0F] rounded-xl border border-border/80 overflow-hidden select-none"
      >
        {/* Subtle coordinate grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <svg
          viewBox="0 0 900 450"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onClick={() => setSelectedNode(null)}
        >
          <defs>
            {/* Pulsing radial glow gradients */}
            <radialGradient id="star-glow-gold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E6A15C" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E6A15C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E6A15C" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="star-glow-cyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7FB8D9" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#7FB8D9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7FB8D9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="star-glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A8D672" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A8D672" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A8D672" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient background twinkling stars */}
          {AMBIENT_STARS.map((s) => (
            <circle
              key={s.id}
              cx={s.x}
              cy={s.y}
              r={s.size}
              fill="#FFFFFF"
              opacity={s.opacity}
              className="pointer-events-none"
            />
          ))}

          {/* Constellation Link Lines */}
          {lines.map((line, idx) => (
            <line
              key={idx}
              x1={line.source.x}
              y1={line.source.y}
              x2={line.target.x}
              y2={line.target.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          ))}

          {/* Constellation Nodes (Repositories) */}
          {visibleNodes.map((node) => {
            const isHovered = activeNode?.repo.id === node.repo.id;
            const hasStars = (node.repo.stargazers_count || 0) > 0;

            return (
              <g
                key={node.repo.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode((prev) => (prev?.repo.id === node.repo.id ? null : node));
                }}
              >
                {/* Corona / Aura Glow */}
                {(hasStars || isHovered) && (
                  <circle
                    cx="0"
                    cy="0"
                    r={isHovered ? node.glowRadius * 1.5 : node.glowRadius}
                    fill={node.color}
                    opacity={isHovered ? 0.4 : 0.18}
                    className="transition-all duration-300"
                  />
                )}

                {/* Target ring for hovered star */}
                {isHovered && (
                  <circle
                    cx="0"
                    cy="0"
                    r={node.radius + 6}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="animate-spin"
                    style={{ transformOrigin: '0 0', animationDuration: '6s' }}
                  />
                )}

                {/* Core Star body */}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? node.radius * 1.3 : node.radius}
                  fill={node.color}
                  stroke="#070A0F"
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />

                {/* Star text label */}
                <text
                  x="0"
                  y={node.radius + 12}
                  textAnchor="middle"
                  fill={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                  fontSize={isHovered ? '10px' : '9px'}
                  fontFamily="monospace"
                  className="pointer-events-none transition-all duration-200"
                >
                  {node.repo.name.length > 18
                    ? `${node.repo.name.slice(0, 16)}...`
                    : node.repo.name}
                </text>

                {/* Star count badge if > 0 */}
                {hasStars && (
                  <text
                    x={node.radius + 4}
                    y={-node.radius}
                    fill="#E6A15C"
                    fontSize="9px"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    ★{node.repo.stargazers_count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* HUD Inspection Overlay Card in Corner */}
        {activeNode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 max-w-sm w-full p-4 rounded-xl bg-bg/95 border border-border/90 shadow-2xl backdrop-blur-md text-xs font-mono z-30 transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 mb-2">
              <span
                className="inline-flex items-center gap-1 font-bold text-sm truncate"
                style={{ color: activeNode.color }}
              >
                <span>{activeNode.repo.name}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="flex items-center gap-1 text-accent-secondary font-bold px-2 py-0.5 rounded bg-bg-deep border border-border">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{activeNode.repo.stargazers_count}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-bg-hover text-fg-muted hover:text-fg transition-colors"
                  title="Close"
                  aria-label="Close star details"
                >
                  <X className="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-fg-muted line-clamp-2 font-sans mb-3">
              {activeNode.repo.description || 'No description provided.'}
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeNode.color }}
                />
                <span className="text-fg">{activeNode.repo.language || 'Documentation'}</span>
              </span>

              <a
                href={activeNode.repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline text-xs"
              >
                <span>View Repo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Legend & Status */}
      <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-fg-muted">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6A15C]" />
            <span>JavaScript</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7FB8D9]" />
            <span>Python</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A8D672]" />
            <span>C++ / C</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9825B]" />
            <span>Java</span>
          </span>
        </div>

        <div className="text-fg-subtle text-[11px]">
          {activeNode ? (
            <span>Stellar coordinates locked: [{activeNode.x}, {activeNode.y}]</span>
          ) : (
            <span>Active repository nodes</span>
          )}
        </div>
      </div>
    </div>
  );
}
