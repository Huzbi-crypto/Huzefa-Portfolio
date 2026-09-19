'use client';

import React, { useEffect } from 'react';
import type { Project } from '@/types/portfolio';
import { ProjectDetail } from './ProjectDetail';
import { X } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  relatedProjects?: Project[];
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  relatedProjects = [],
}: ProjectDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg rounded-2xl border border-border/80 shadow-2xl overflow-y-auto z-10 overscroll-contain">
        {/* Sticky Modal Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-bg/95 backdrop-blur border-b border-border/80">
          <div className="flex items-center gap-2 text-xs font-mono text-fg-muted">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
            <span>INSPECTION // {project.slug}.manifest</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-fg-subtle border border-border px-1.5 py-0.5 rounded">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-fg-muted hover:text-fg border border-border transition-colors"
              aria-label="Close project modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          <ProjectDetail
            project={project}
            relatedProjects={relatedProjects}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
