'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { projects } from '@/data/projects';
import { copy } from '@/game/content/copy';
import type { GameStore } from '@/game/state/store';
import './game.css';

/**
 * The real project details, in a hard-edged panel over the game. Everything
 * here is text from `src/data/projects.ts`; the labels live in `copy.ts`.
 * Esc, a visible close button, or a tap outside dismisses it.
 */
export function ProjectPanel({ store }: { store: GameStore }) {
  const ui = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const project = ui.project ? projects.find((item) => item.id === ui.project) : undefined;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ui.project) return;

    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      store.closeProject();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [ui.project, store]);

  if (!project) return null;

  return (
    <div
      className="project-panel-backdrop"
      data-testid="project-panel-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) store.closeProject();
      }}
    >
      <div
        className="project-panel px-panel"
        role="dialog"
        aria-modal="true"
        aria-label={copy.projectPanel.label}
      >
        <button
          ref={closeRef}
          type="button"
          className="project-panel-close"
          data-close
          aria-label={copy.projectPanel.closeLabel}
          onClick={() => store.closeProject()}
        >
          {copy.projectPanel.close}
        </button>

        <h2 className="project-panel-title">{project.title}</h2>
        <p className="project-panel-tagline">{project.tagline}</p>
        <p className="project-panel-body">{project.description}</p>

        <p className="project-panel-stack">
          <span>{copy.projectPanel.builtWith}:</span> {project.techStack.join(' / ')}
        </p>

        <div className="project-panel-links">
          {project.githubUrl ? (
            <a
              className="project-panel-link"
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.projectPanel.repo}
            </a>
          ) : null}
          {project.demoUrl ? (
            <a
              className="project-panel-link"
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.projectPanel.demo}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
