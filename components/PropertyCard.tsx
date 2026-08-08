import Image from 'next/image';
import Link from 'next/link';
import { Unit } from '@/lib/types';
import { formatPHP } from '@/lib/rates';
import { UNIT_FEATURES, FEATURE_ICONS } from '@/lib/features';

type Props = { unit: Unit; dimmed?: boolean };

export default function PropertyCard({ unit, dimmed = false }: Props) {
  const features = UNIT_FEATURES[unit.id]?.room?.slice(0, 3) ?? [];

  return (
    <Link
      href={`/units/${unit.id}`}
      className={`group block w-full min-w-0 ${dimmed ? 'opacity-40 grayscale' : ''}`}
    >
      <article className="w-full rounded-2xl bg-brand-white border border-brand-light
                          overflow-hidden shadow-sm transition-all duration-300
                          group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-brand-secondary/50">
        {/* Image area */}
        <div className="relative h-56 sm:h-72 bg-brand-light/60">
          {unit.imageUrl && (
            <Image
              src={unit.imageUrl}
              alt={unit.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {/* Top-left badge */}
          <span className="absolute top-3 left-3 bg-brand-white/95 backdrop-blur-sm text-brand-primary
                           text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Studio
          </span>
          {/* Save icon (visual only for now — will be interactive when favorites are wired up) */}
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 w-9 h-9 bg-brand-white/95 backdrop-blur-sm
                       rounded-full flex items-center justify-center shadow-sm
                       transition-all group-hover:bg-brand-blush"
          >
            <svg className="w-4 h-4 text-brand-secondary group-hover:text-brand-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="font-bold text-gray-900 text-base sm:text-lg leading-snug
                           group-hover:text-brand-primary transition-colors min-w-0">
              {unit.name}
            </h2>
            <div className="text-right flex-shrink-0">
              <span className="text-brand-primary font-bold text-base sm:text-lg">{formatPHP(unit.standardRate)}</span>
              <span className="block text-[10px] font-normal text-brand-secondary -mt-0.5">/night</span>
            </div>
          </div>

          {/* Location line */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 min-w-0">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">I.T. Park, Cebu</span>
          </div>

          {/* Meta line: max guests + short specs */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 pb-3 border-b border-brand-light">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Up to {unit.maxGuests} guests
            </span>
            <span className="text-gray-300">·</span>
            <span className="truncate">{unit.location.split(',').slice(-2).join(',').trim()}</span>
          </div>

          {/* Feature chips (top 3) */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {features.map((f) => (
              <div key={f.label}
                className="flex items-center gap-1 bg-brand-bg border border-brand-light
                           rounded-full px-2.5 py-0.5 text-[11px] text-gray-600 min-w-0">
                <svg className="w-3 h-3 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={FEATURE_ICONS[f.icon]} />
                </svg>
                <span className="truncate">{f.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-secondary">Free cancellation · Instant confirm</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary
                             group-hover:gap-2 transition-all">
              Book here
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
