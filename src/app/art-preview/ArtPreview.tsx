'use client';

import { useEffect, useRef } from 'react';
import { ANIMS, PALETTES, SPRITES } from '@/game/art';
import { drawSprite } from '@/game/render/sprite';

const SCALE = 6;
const P = PALETTES['cozy-crt'];

type Painter = (g: CanvasRenderingContext2D, tMs: number) => void;

function Px({ w, h, bg, paint, animated = false, label, scale = SCALE }: {
  w: number; h: number; bg?: string; paint: Painter; animated?: boolean; label: string; scale?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    g.imageSmoothingEnabled = false;
    let raf = 0;
    const draw = (t: number) => {
      g.clearRect(0, 0, w, h);
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
      paint(g, t);
      if (animated) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [w, h, bg, paint, animated]);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <canvas
        ref={ref}
        width={w}
        height={h}
        aria-label={label}
        style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated', display: 'block' }}
      />
      <figcaption className="font-pixel text-sm text-text-muted">{label}</figcaption>
    </figure>
  );
}

const painters = new Map<string, Painter>();
function still(name: string) {
  let paint = painters.get(name);
  if (!paint) {
    paint = (g) => drawSprite(g, SPRITES[name], 0, 0);
    painters.set(name, paint);
  }
  return { w: SPRITES[name].w, h: SPRITES[name].h, paint };
}

const anim = (name: string, fps: number): Painter => (g, t) => {
  const frames = ANIMS[name];
  drawSprite(g, SPRITES[frames[Math.floor((t / 1000) * fps) % frames.length]], 0, 0);
};

const WALL = P.c;
const FLOOR = P.g;

/** A small composed room: do the pieces read as one place? */
const roomPaint: Painter = (g, t) => {
  const W = 192;
  for (let x = 0; x < W; x += 16) {
    drawSprite(g, SPRITES.wall, x, 0);
    drawSprite(g, SPRITES.wall, x, 16);
    drawSprite(g, SPRITES.wallBase, x, 32);
    drawSprite(g, SPRITES.floorUnderWall, x, 48);
    for (let y = 64, r = 0; y < 128; y += 16, r++) {
      drawSprite(g, SPRITES[(x / 16 + r) % 2 ? 'floorAlt' : 'floor'], x, y);
    }
  }
  drawSprite(g, SPRITES.window, 14, 4);
  drawSprite(g, SPRITES.shelfFull, 62, 8);
  drawSprite(g, SPRITES.desk, 100, 24);
  drawSprite(g, SPRITES[Math.floor(t / 180) % 7 === 0 ? 'crt-1' : 'crt'], 114, 8);
  drawSprite(g, SPRITES.tea, 140, 26);
  drawSprite(g, SPRITES.note, 104, 26);
  drawSprite(g, SPRITES.doorLight, 162, 48);
  drawSprite(g, SPRITES.doorClosed, 164, 8);
  drawSprite(g, SPRITES.rug, 64, 80);
  drawSprite(g, SPRITES.sofa, 8, 78);
  drawSprite(g, SPRITES.lampGlow, 128, 52);
  drawSprite(g, SPRITES.lamp, 142, 54);
  drawSprite(g, SPRITES[ANIMS['cat-sit'][Math.floor(t / 700) % 2]], 118, 98);
  drawSprite(g, SPRITES[ANIMS['visitor-down'][Math.floor(t / 140) % 4]], 92, 70);
  for (const [x, y] of [[20, 10], [40, 14]]) drawSprite(g, SPRITES.starLit, x, y);
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="font-pixel text-2xl text-accent-cream mb-4">{title}</h2>
    <div className="flex flex-wrap items-end gap-8">{children}</div>
  </section>
);

export default function ArtPreview() {
  const dirs = ['down', 'up', 'left', 'right'] as const;
  return (
    <div className="min-h-screen bg-bg px-8 py-10 text-text">
      <h1 className="font-pixel text-4xl text-accent mb-1">Art preview</h1>
      <p className="font-pixel text-lg text-text-muted mb-10">
        Everything at {SCALE}x, no smoothing. Not shipped: this route 404s in production.
      </p>

      <Section title="The room, composed (4x)">
        <Px label="composed room" w={192} h={128} scale={4} animated paint={roomPaint} />
      </Section>

      <Section title="Visitor: walk cycles, then idle">
        {dirs.map((d) => (
          <Px key={d} label={`walk ${d}`} w={16} h={24} bg={FLOOR} animated paint={anim(`visitor-${d}`, 6)} />
        ))}
        {dirs.map((d) => (
          <Px key={`i${d}`} label={`idle ${d}`} bg={FLOOR} {...still(`visitor-${d}-0`)} />
        ))}
      </Section>

      <Section title="Cat">
        <Px label="sitting, tail flick" w={16} h={14} bg={FLOOR} animated paint={anim('cat-sit', 2)} />
        <Px label="sleeping" bg={FLOOR} {...still('cat-sleeping')} />
        <Px label="walking" w={18} h={11} bg={FLOOR} animated paint={anim('cat-walk', 8)} />
      </Section>

      <Section title="Wall and floor">
        {['floor', 'floorAlt', 'floorUnderWall', 'wall', 'wallBase'].map((n) => (
          <Px key={n} label={n} {...still(n)} />
        ))}
      </Section>

      <Section title="Furniture">
        <Px label="desk" bg={WALL} {...still('desk')} />
        <Px label="crt (flickers)" w={20} h={20} bg={WALL} animated paint={(g, t) => drawSprite(g, SPRITES[Math.floor(t / 180) % 5 === 0 ? 'crt-1' : 'crt'], 0, 0)} />
        <Px label="sofa" bg={FLOOR} {...still('sofa')} />
        <Px label="rug" bg={FLOOR} {...still('rug')} />
        <Px label="lamp" bg={WALL} {...still('lamp')} />
        <Px label="lampGlow" bg={FLOOR} {...still('lampGlow')} />
        <Px label="window" bg={WALL} {...still('window')} />
      </Section>

      <Section title="Shelf, props and door">
        <Px label="shelf (empty)" bg={WALL} {...still('shelf')} />
        <Px label="shelf (books)" bg={WALL} {...still('shelfFull')} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Px key={i} label={`spine ${i}`} bg={P.e} {...still(`shelfSpine${i}`)} />
        ))}
        <Px label="tea" bg={FLOOR} {...still('tea')} />
        <Px label="note" bg={FLOOR} {...still('note')} />
        <Px label="starDim" bg={P.D} {...still('starDim')} />
        <Px label="starLit" bg={P.D} {...still('starLit')} />
        <Px label="doorClosed" bg={WALL} {...still('doorClosed')} />
        <Px label="doorOpen" bg={WALL} {...still('doorOpen')} />
        <Px label="doorLight" bg={FLOOR} {...still('doorLight')} />
      </Section>

      <Section title="Font, at body size">
        <div className="max-w-xl font-pixel text-base leading-relaxed">
          <p className="mb-3">
            I read manga and books, build things nobody asked for, and keep a
            cat on the desk. 0123456789. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-sm text-text-muted">
            Small print at 14px: Back in 5 mins. Don&apos;t touch anything.
          </p>
        </div>
      </Section>
    </div>
  );
}
