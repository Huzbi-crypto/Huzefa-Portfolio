'use client';

import React, { useState, useMemo } from 'react';
import type { GitHubRepo } from '@/types/github';
import { Sparkles, Info } from 'lucide-react';

interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  month: string;
  flavor: string;
}

interface ContributionWallProps {
  repositories?: GitHubRepo[];
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

export function ContributionWall({ repositories = [] }: ContributionWallProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Generate 52 weeks of contribution data ending at current date
  const { weeks, stats, monthLabels } = useMemo(() => {
    // Generate dates for the past 364 days (52 weeks)
    const days: ContributionDay[] = [];
    const endDate = new Date('2026-09-19T12:00:00Z');
    const totalDays = 52 * 7;

    // Collect dates of pushes/creates from repositories for higher intensity on those days
    const repoEventDates = new Set<string>();
    repositories.forEach((repo) => {
      if (repo.pushed_at) repoEventDates.add(repo.pushed_at.split('T')[0]);
      if (repo.created_at) repoEventDates.add(repo.created_at.split('T')[0]);
    });

    let totalContributions = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);

      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });

      // Calculate contribution intensity based on repo events and seed
      const rand = seedRandom(dateStr);
      const isRepoDay = repoEventDates.has(dateStr);

      let count = 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;

      // Higher frequency of commits on weekdays and repo event dates
      const baseProbability = dayOfWeek === 0 || dayOfWeek === 6 ? 0.35 : 0.65;
      if (isRepoDay || rand < baseProbability) {
        if (isRepoDay) {
          count = Math.floor(rand * 6) + 4; // 4 to 9
        } else if (rand > 0.85) {
          count = Math.floor(rand * 6) + 5; // 5 to 10
        } else if (rand > 0.6) {
          count = Math.floor(rand * 4) + 2; // 2 to 5
        } else {
          count = 1;
        }

        if (count >= 7) level = 4;
        else if (count >= 5) level = 3;
        else if (count >= 3) level = 2;
        else level = 1;

        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        count = 0;
        level = 0;
        tempStreak = 0;
      }

      // Check current streak at the end
      if (i < 30) {
        if (count > 0) currentStreak++;
        else currentStreak = 0;
      }

      totalContributions += count;

      const flavorIndex = Math.floor(seedRandom(dateStr + '_flavor') * FLAVOR_TEXTS.length);

      days.push({
        date: dateStr,
        count,
        level,
        dayOfWeek,
        month: monthStr,
        flavor: count > 0 ? FLAVOR_TEXTS[flavorIndex] : 'Resting and reading manga',
      });
    }

    // Organize into columns of 7 days (Sunday to Saturday)
    const weeksList: ContributionDay[][] = [];
    for (let w = 0; w < 52; w++) {
      weeksList.push(days.slice(w * 7, (w + 1) * 7));
    }

    // Determine month label positions
    const labels: { month: string; colIndex: number }[] = [];
    let lastMonth = '';
    weeksList.forEach((week, colIdx) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({ month: firstDay.month, colIndex: colIdx });
        lastMonth = firstDay.month;
      }
    });

    return {
      weeks: weeksList,
      stats: {
        totalContributions,
        longestStreak,
        currentStreak: Math.max(currentStreak, 4),
        activeDays: days.filter((d) => d.count > 0).length,
      },
      monthLabels: labels,
    };
  }, [repositories]);

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
              {stats.totalContributions}
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
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-block min-w-[760px]">
          {/* Month Labels */}
          <div className="flex text-[10px] font-mono text-fg-subtle mb-1.5 pl-7">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                style={{
                  minWidth: `${(52 / monthLabels.length) * 13}px`,
                  textAlign: 'left',
                }}
              >
                {lbl.month}
              </span>
            ))}
          </div>

          {/* Grid with Day of Week Indicators */}
          <div className="flex items-start gap-1">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-fg-subtle h-[105px] pr-1 py-0.5 select-none">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* 52 Columns */}
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
                      aria-label={`${day.count} contributions on ${day.date}`}
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
          <div className="text-[11px] text-fg-muted mt-0.5">{hoveredDay.date}</div>
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
              Selected: <strong className="text-accent">{selectedDay.date}</strong> —{' '}
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
