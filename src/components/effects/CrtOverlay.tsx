'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

/**
 * The CRT scanlines and stepped vignette. A still image: one-pixel lines, no
 * flicker, no animation, so it is identical (and safe) under reduced motion.
 */
export default function CrtOverlay() {
  const { crtEffect } = useApp();

  if (!crtEffect) return null;

  return <div className="crt-overlay" aria-hidden="true" data-crt-overlay />;
}
