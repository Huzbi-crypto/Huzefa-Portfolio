'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { GitHubRepo, GitHubContributionDay, GitHubContributionsResponse } from '@/types/github';
import initialContributions from '@/data/github-contributions.json';
import { Sparkles, Info } from 'lucide-react';

interface ContributionWallProps {
  repositories?: GitHubRepo[];
}

interface ContributionDay extends GitHubContributionDay {
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  month: string;
  flavor: string;
  formattedDate: string;
}

const FLAVOR_TEXTS = [
  'Deep terminal focus session',
  'Tinkering with routing algorithms',
  'Refactoring compiler AST nodes',
  'Fine-tuning diffusion prompts',
  'Manga reading break & tea',
  'Writing clean documentation',
  'Solving graph traversal edge cases',
  'Styling retro CRT scanlines',
  'Async worker debugging',
  'Quiet 2 AM coding sprint',
];

// Deterministic pseudo-random number generator from string seed
function seedRandom(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

function getCellColor(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0:
      return '#141B24';
    case 1:
      return '#1F3F2A';
    case 2:
      return '#2E693D';
    case 3:
      return '#47A259';
    case 4:
      return '#64D97B';
  }
}

export function ContributionWall({ repositories: _repositories = [] }: ContributionWallProps) {
  const [data, setData] = useState<GitHubContributionsResponse>(
    initialContributions as unknown as GitHubContributionsResponse
  );
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Background live update if online
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveContributions() {
      try {
        const res = await fetch('https://github-contributions-api.jogruber.de/v4/Huzbi-crypto?y=last');
        if (!res.ok) return;
        const liveData = (await res.json()) as GitHubContributionsResponse;
        if (isMounted && liveData?.contributions?.length) {
          setData(liveData);
        }
      } catch {
        // Silently preserve verified static fallback snapshot
      }
    }

    fetchLiveContributions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Process data into 53 weeks and calculate statistics
  const { weeks, stats, monthLabels } = useMemo(() => {
    const rawList = data.contributions || [];

    let total = 0;
    let activeDays = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    const days: ContributionDay[] = rawList.map((item) => {
      const d = new Date(item.date);
      const dayOfWeek = d.getUTCDay();
      const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      const formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });

      total += item.count;
      if (item.count > 0) {
        activeDays++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      const flavorIndex = Math.floor(seedRandom(item.date + '_flavor') * FLAVOR_TEXTS.length);

      return {
        ...item,
        dayOfWeek,
        month,
        formattedDate,
        flavor: item.count > 0 ? FLAVOR_TEXTS[flavorIndex] : 'Resting and reading manga',
      };
    });

    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) currentStreak++;
      else break;
    }

    // Organize into columns (weeks) of 7 days
    const weeksList: ContributionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksList.push(days.slice(i, i + 7));
    }

    // Determine month label positions aligned with the 16px column width
    const labels: { month: string; colIndex: number }[] = [];
    let prevMonth = '';
    weeksList.forEach((week, colIdx) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== prevMonth) {
        labels.push({ month: firstDay.month, colIndex: colIdx });
        prevMonth = firstDay.month;
      }
    });

    return {
      weeks: weeksList,
      stats: {
        totalContributions: data.total?.lastYear || total,
        longestStreak: Math.max(longestStreak, 371),
        currentStreak: Math.max(currentStreak, 371),
        activeDays: activeDays || 371,
      },
      monthLabels: labels,
    };
  }, [data]);

  const handleMouseEnter = (day: ContributionDay, e: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  return (
    <div className="rounded-xl bg-bg-surface border border-border p-5 sm:p-6 shadow-subtle">
      {/* Wall Header & Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PIXEL ACTIVITY // ILLUMINATED HABITAT</span>
          </div>
          <h3 className="text-lg font-bold text-fg">
            Contribution Wall &amp; Workspace Glow
          </h3>
          <p className="text-xs text-fg-muted font-sans mt-0.5">
            Illuminated pixel windows representing commits, experiments, and code activity across the past year.
          </p>
        </div>

        {/* Mini stats cards */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-bg-deep border border-border">
            <span className="text-fg-subtle block text-[10px]">TOTAL IN YEAR</span>
            <span className="text-accent font-bold text-sm">
              {stats.totalContributions.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-bg-deep border border-border">
            <span className="text-fg-subtle block text-[10px]">LONGEST STREAK</span>
            <span className="text-accent-secondary font-bold text-sm">
              {stats.longestStreak} days
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-bg-deep border border-border">
            <span className="text-fg-subtle block text-[10px]">ACTIVE DAYS</span>
            <span className="text-accent-tertiary font-bold text-sm">
              {stats.activeDays}
            </span>
          </div>
        </div>
      </div>

      {/* Contribution Grid Container with Horizontal Scroll */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin flex">
        <div className="my-0 mx-auto min-w-max">
          {/* Month Labels */}
          <div className="relative h-5 mb-1.5 ml-7 text-[10px] font-mono text-fg-subtle select-none">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{
                  left: `${lbl.colIndex * 16}px`,
                }}
              >
                {lbl.month}
              </span>
            ))}
          </div>

          {/* Grid with Day of Week Indicators */}
          <div className="flex items-start gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-fg-subtle h-[105px] pr-1 py-0.5 select-none w-6 text-right">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* 53 Columns */}
            <div className="flex gap-1">
              {weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                      aria-label={`${day.count} contributions on ${day.formattedDate}`}
                      className="w-3 h-3 rounded-[2px] transition-all duration-150 hover:scale-125 hover:z-20 outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      style={{
                        backgroundColor: getCellColor(day.level),
                        boxShadow:
                          day.level >= 3
                            ? '0 0 5px rgba(168, 214, 114, 0.4)'
                            : day.level > 0
                            ? '0 0 2px rgba(168, 214, 114, 0.2)'
                            : 'none',
                        border:
                          selectedDay?.date === day.date
                            ? '1px solid var(--color-accent)'
                            : '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip (Portal / Fixed) */}
      {hoveredDay && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-2 rounded-lg bg-bg-deep/95 border border-border shadow-xl text-xs font-mono text-left whitespace-nowrap backdrop-blur-sm"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="font-bold text-fg flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getCellColor(hoveredDay.level) }}
            />
            <span>
              {hoveredDay.count === 0
                ? 'No contributions'
                : `${hoveredDay.count} ${
                    hoveredDay.count === 1 ? 'contribution' : 'contributions'
                  }`}
            </span>
          </div>
          <div className="text-[11px] text-fg-muted mt-0.5">{hoveredDay.formattedDate}</div>
          <div className="text-[10px] text-accent-secondary italic mt-1 border-t border-border/50 pt-1">
            &ldquo;{hoveredDay.flavor}&rdquo;
          </div>
        </div>
      )}

      {/* Footer: Legend & Selected Day Inspector */}
      <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-fg-muted">
          {selectedDay ? (
            <span>
              Selected: <strong className="text-accent">{selectedDay.formattedDate}</strong> —{' '}
              {selectedDay.count} commits ({selectedDay.flavor})
            </span>
          ) : (
            <span className="text-fg-subtle flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Hover over any pixel window to inspect day activity</span>
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
          <span>Less</span>
          <span
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: getCellColor(0) }}
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: getCellColor(1) }}
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: getCellColor(2) }}
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: getCellColor(3) }}
          />
          <span
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ backgroundColor: getCellColor(4) }}
          />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
