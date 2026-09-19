import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx,css}',
  ],
  darkMode: ['class', '[data-theme]'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--color-bg)',
          deep: 'var(--color-bg-deep)',
          surface: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
        },
        fg: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          secondary: 'var(--color-accent-secondary)',
          tertiary: 'var(--color-accent-tertiary)',
          cream: 'var(--color-accent-cream)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          highlight: 'var(--color-border-highlight)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        pixel: ['var(--font-pixel)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        crt: '0 0 20px var(--color-glow)',
        'crt-strong': '0 0 35px var(--color-glow)',
        subtle: '0 2px 10px rgba(0, 0, 0, 0.4)',
        pixel: '2px 2px 0px 0px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%': { opacity: '0.97' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        scanline: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
