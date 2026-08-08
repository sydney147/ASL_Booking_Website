'use client';

import { useMemo, useState } from 'react';
import { Unit } from '@/lib/types';
import PropertyCard from './PropertyCard';

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'capacity';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'capacity',   label: 'Most Guests' },
];

export default function PropertyList({ units }: { units: Unit[] }) {
  const [guestFilter, setGuestFilter] = useState<number>(1);
  const [sortMode,    setSortMode]    = useState<SortMode>('featured');
  const [petsOnly,    setPetsOnly]    = useState<boolean>(false);

  // Split into "matches" (can fit guests + optional pets filter) and "others"
  // so we can dim the mismatched ones instead of hiding them.
  const { matching, mismatching } = useMemo(() => {
    const match = (u: Unit): boolean =>
      u.maxGuests >= guestFilter && (!petsOnly || u.petsFriendly);

    const sorted = [...units].sort((a, b) => {
      switch (sortMode) {
        case 'price-asc':  return a.standardRate - b.standardRate;
        case 'price-desc': return b.standardRate - a.standardRate;
        case 'capacity':   return b.maxGuests - a.maxGuests;
        default:           return 0;
      }
    });

    return {
      matching:    sorted.filter(match),
      mismatching: sorted.filter(u => !match(u)),
    };
  }, [units, guestFilter, sortMode, petsOnly]);

  const totalMatches = matching.length;

  return (
    <>
      {/* Filter bar */}
      <div className="sticky top-14 sm:top-[70px] z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 mb-6
                      bg-brand-bg/90 backdrop-blur-md border-b border-brand-light">
        <div className="flex flex-wrap items-center gap-3">

          {/* Guests */}
          <label className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Guests</span>
            <select
              value={guestFilter}
              onChange={(e) => setGuestFilter(Number(e.target.value))}
              className="rounded-full border border-brand-light bg-brand-white px-3 py-1.5
                         text-sm font-medium text-gray-800 focus:border-brand-secondary
                         focus:outline-none focus:ring-1 focus:ring-brand-secondary cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}+ guest{n === 1 ? '' : 's'}</option>
              ))}
            </select>
          </label>

          {/* Pets */}
          <button
            type="button"
            onClick={() => setPetsOnly(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              petsOnly
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-brand-white text-gray-600 border-brand-light hover:border-brand-secondary'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Pet-friendly
          </button>

          {/* Sort */}
          <label className="flex items-center gap-2 text-xs ml-auto">
            <span className="text-gray-500 font-medium hidden sm:inline">Sort</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-full border border-brand-light bg-brand-white px-3 py-1.5
                         text-sm font-medium text-gray-800 focus:border-brand-secondary
                         focus:outline-none focus:ring-1 focus:ring-brand-secondary cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {/* Count */}
          <p className="w-full sm:w-auto text-xs text-gray-500">
            <span className="font-semibold text-brand-primary">{totalMatches}</span>
            {' '}of {units.length} units fit your search
          </p>
        </div>
      </div>

      {/* Matching units */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 mb-8">
        {matching.map((unit) => (
          <PropertyCard key={unit.id} unit={unit} />
        ))}
      </div>

      {/* Mismatching units — dimmed */}
      {mismatching.length > 0 && (
        <div className="pt-2 border-t border-brand-light">
          <p className="text-xs text-gray-400 mb-3 mt-4">
            Doesn&apos;t fit your search — but you can still view them:
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {mismatching.map((unit) => (
              <PropertyCard key={unit.id} unit={unit} dimmed />
            ))}
          </div>
        </div>
      )}

      {matching.length === 0 && mismatching.length === 0 && (
        <p className="text-center text-gray-400 py-8">No units available.</p>
      )}
    </>
  );
}
