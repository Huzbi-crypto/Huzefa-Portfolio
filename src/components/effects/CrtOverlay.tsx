'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function CrtOverlay() {
  const { crtEffect } = useApp();

  if (!crtEffect) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 crt-scanlines opacity-40 crt-vignette select-none"
      aria-hidden="true"
    />
  );
}
