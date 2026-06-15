'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Props = { images: string[]; alt: string };

export default function ImageGallery({ images, alt }: Props) {
  const [selected,     setSelected]     = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Close lightbox on Escape, navigate with arrow keys
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      setLightboxOpen(false);
      if (e.key === 'ArrowRight')  setSelected(s => Math.min(s + 1, images.length - 1));
      if (e.key === 'ArrowLeft')   setSelected(s => Math.max(s - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, images.length]);

  if (!images.length) return null;

  return (
    <>
      {/* ── Gallery ──────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-brand-light mb-6">

        {/* Main image — click to open lightbox */}
        <div
          className="relative w-full bg-brand-light/60 cursor-zoom-in"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            key={selected}
            src={images[selected]}
            alt={`${alt} photo ${selected + 1}`}
            fill
            priority
            className="object-cover transition-opacity duration-300"
          />

          {/* Expand hint */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm
                          text-white p-1.5 rounded-lg pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>

          {/* Counter */}
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm
                          text-white text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none">
            {selected + 1} / {images.length}
          </div>

          {/* Prev arrow */}
          {selected > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(s => s - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                         bg-black/40 backdrop-blur-sm text-white flex items-center justify-center
                         hover:bg-black/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {selected < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(s => s + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                         bg-black/40 backdrop-blur-sm text-white flex items-center justify-center
                         hover:bg-black/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail strip — fills full width */}
        {images.length > 1 && (
          <div className="grid gap-1.5 p-1.5 bg-brand-bg"
            style={{ gridTemplateColumns: `repeat(${images.length}, 1fr)` }}>
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative w-full rounded-lg overflow-hidden border-2 transition-all
                  ${i === selected
                    ? 'border-brand-primary opacity-100 shadow-sm'
                    : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                style={{ aspectRatio: '4/3', minHeight: 36 }}
              >
                <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-screen p-4 sm:p-10"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={`${alt} photo ${selected + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10
                       hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2
                          bg-white/10 text-white text-sm px-4 py-1.5 rounded-full">
            {selected + 1} / {images.length}
          </div>

          {/* Prev */}
          {selected > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(s => s - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                         bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next */}
          {selected < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(s => s + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                         bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2
                            bg-black/40 backdrop-blur-sm rounded-2xl overflow-x-auto max-w-[90vw]">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setSelected(i); }}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                    ${i === selected
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-40 hover:opacity-70'
                    }`}
                  style={{ width: 64, height: 44 }}
                >
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
