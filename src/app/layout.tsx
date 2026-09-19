import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/navigation/Navbar';
import TerminalModal from '@/components/terminal/TerminalModal';
import CrtOverlay from '@/components/effects/CrtOverlay';

export const metadata: Metadata = {
  metadataBase: new URL('https://huzefa.vercel.app'),
  title: 'Huzbi | Developer & Creative Coder',
  description: "I'm Huzbi. I like to code and read manga 'n books. Interactive personal digital room and project archive.",
  icons: {
    icon: '/favicon.svg',
  },
  authors: [{ name: 'Huzbi (Huzefa Saifuddin)', url: 'https://github.com/Huzbi-crypto' }],
  keywords: ['Huzbi', 'Huzefa Saifuddin', 'Creative Coding', 'Systems', 'Networking', 'AI', 'Portfolio', 'FAST NU'],
  openGraph: {
    title: 'Huzbi | Developer & Creative Coder',
    description: "I'm Huzbi. I like to code, read manga 'n books, and build curious systems.",
    url: 'https://huzefa.vercel.app/',
    siteName: 'Huzbi Digital Room',
    images: [
      {
        url: '/assets/cwnilmm1twqb1.jpeg',
        width: 1024,
        height: 1024,
        alt: 'Huzbi Avatar Artwork',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Huzbi | Developer & Creative Coder',
    description: "I'm Huzbi. I like to code and read manga 'n books.",
    images: ['/assets/cwnilmm1twqb1.jpeg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="cozy-crt" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        {/* Prevent theme flash by restoring theme before DOM renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('huzbi-theme');
                if (savedTheme) {
                  document.documentElement.setAttribute('data-theme', savedTheme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased selection:bg-accent selection:text-bg">
        <AppProvider>
          {/* Skip link for keyboard accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-bg focus:font-mono focus:text-xs focus:rounded-md focus:shadow-crt focus:outline-none"
          >
            Skip to main content
          </a>

          {/* CRT Scanline & Vignette Effect */}
          <CrtOverlay />

          {/* Persistent Retro Navigation Bar */}
          <Navbar />

          {/* Main Page Content */}
          <main id="main-content" className="relative min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>

          {/* Global Interactive Retro Terminal Shell Modal */}
          <TerminalModal />
        </AppProvider>
      </body>
    </html>
  );
}
