import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASL Cozy Living Booking Site',
  description: 'Find homes, villas and escapes that match your lifestyle.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-brand-white">
        <header className="sticky top-0 z-30 bg-brand-white/95 backdrop-blur border-b border-brand-light">
          <div className="w-full px-3 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
            <Link href="/" className="font-display text-base sm:text-2xl text-brand-primary tracking-tight whitespace-nowrap">
              ASL Cozy Living
            </Link>
            <nav className="flex items-center gap-3 sm:gap-7 text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">
              <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
              <Link href="/my-booking" className="hover:text-brand-primary transition-colors">Find Booking</Link>
              <Link href="/admin" className="hover:text-brand-primary transition-colors">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-brand-primary text-white">
          <div className="w-full px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm">
            <Link href="/" className="font-display text-lg text-white">
              ASL Cozy Living
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/70">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                IT Park, Cebu City
              </span>
              <a href="tel:09159757367" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                09159757367
              </a>
              <a href="mailto:aslcozyliving@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                aslcozyliving@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
