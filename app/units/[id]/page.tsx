import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchUnit, fetchUnits } from '@/lib/units';
import BookingForm from '@/components/BookingForm';
import ImageGallery from '@/components/ImageGallery';
import PropertyCard from '@/components/PropertyCard';
import DescriptionText from '@/components/DescriptionText';
import ReviewsStrip from '@/components/ReviewsStrip';
import { UNIT_FEATURES, FEATURE_ICONS } from '@/lib/features';

const UNIT_IMAGES: Record<string, string[]> = {
  'room-2421': [
    '/2421/IMG_4358.jpg',
    '/2421/IMG_4359.jpg',
    '/2421/IMG_4363.jpg',
    '/2421/IMG_4365.jpg',
    '/2421/IMG_4366.jpg',
    '/2421/IMG_4367.jpg',
    '/2421/IMG_4368.jpg',
    '/2421/IMG_4370.jpg',
  ],
  'room-2621': [
    '/2621/IMG_4322.jpg',
    '/2621/IMG_4323.jpg',
    '/2621/IMG_4324.jpg',
    '/2621/IMG_4325.jpg',
    '/2621/IMG_4327.jpg',
    '/2621/IMG_4328.jpg',
    '/2621/IMG_4329.jpg',
    '/2621/IMG_4331.jpg',
  ],
  'room-2521': [
    '/2521/IMG_4288.jpg',
    '/2521/IMG_4289.jpg',
    '/2521/IMG_4290.jpg',
    '/2521/IMG_4291.jpg',
    '/2521/IMG_4292.jpg',
    '/2521/IMG_4293.jpg',
    '/2521/IMG_4294.jpg',
    '/2521/IMG_4295.jpg',
  ],
  'room-526': [
    '/526/att._fJPYgoPF6nBsG4WrStm6G2McqieI64zn1AQimNTqGE.jpg',
    '/526/att.4_847JBxtSemxKvcUzIx0k5UlxoBgtlmcuC_CZ1KAyM.jpg',
    '/526/att.78p4i1Qr-EyUyKhl6xXshKjQbA-2gVIUSSq6tpox_Kc.jpg',
    '/526/att.BZR6MAilYtiyvpuWbPuI9LtGx7E0ARN9Cpgt75cEHlo.jpg',
    '/526/att.c759aOKi9Bl6a2I6ngo7MusVaPpJxCdpjcrKNojyFpI.jpg',
    '/526/att.EDYilafKmGT8I7O32KdDniYrJe-Fz00Vypn62Cfzytk.jpg',
    '/526/att.FtHYs9AHz3mBvNP20vUjaGz9OZC4pGr1qM2oXjjZAeg.jpg',
    '/526/att.gMAMXnjpJOeDb9Jl7c1QSIAVyqiL9Pm8jjuaFw5Qwlg.jpg',
  ],
};

export const dynamic = 'force-dynamic';

export default async function UnitBookingPage({ params }: { params: { id: string } }) {
  const [unit, allUnits] = await Promise.all([fetchUnit(params.id), fetchUnits()]);
  if (!unit) notFound();

  const features    = UNIT_FEATURES[unit.id] ?? { room: [], building: [] };
  const images      = UNIT_IMAGES[unit.id] ?? [];
  const otherUnits  = allUnits.filter(u => u.id !== unit.id);

  // Merged offerings for "What this place offers"
  const allOfferings = [...features.room, ...features.building];

  const heroImage = unit.imageUrl;

  return (
    <div>
      {/* ── Compact hero banner ────────────────────────────── */}
      <div className="relative h-40 sm:h-56 w-full overflow-hidden">
        <Image
          src={heroImage}
          alt={unit.name}
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <a href="/"
          className="absolute top-4 left-4 sm:left-8 inline-flex items-center gap-1.5
                     bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors
                     text-white text-xs font-medium px-3 py-1.5 rounded-full">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>

        <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-8 sm:right-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-white leading-tight drop-shadow-md">
            {unit.name}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow leading-snug">{unit.location}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-brand-secondary mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">{unit.name}</span>
        </nav>

        {/* Rating + quick specs strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="font-semibold text-gray-800">4.9</span>
            <span className="text-brand-secondary">(24 reviews)</span>
          </div>
          <span className="text-gray-300">·</span>
          <span>{unit.address}</span>
        </div>

        {/* ── Two-column layout: content | sticky booking widget ── */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">

          {/* LEFT — content */}
          <div className="min-w-0">

            {/* Gallery */}
            <ImageGallery images={images} alt={unit.name} />

            {/* Info bar */}
            <div className="grid grid-cols-3 gap-2 mb-6 mt-2">
              {[
                { label: 'Studio',           icon: 'M4 6h16M4 12h16M4 18h16' },
                { label: `Up to ${unit.maxGuests}`, sub: 'guests', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label: unit.location.split(',').slice(-1)[0]?.trim() ?? 'Room', sub: 'private studio', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-brand-white border border-brand-light px-3 py-2.5 text-center">
                  <svg className="w-5 h-5 mx-auto text-brand-secondary mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                  </svg>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{s.label}</p>
                  {s.sub && <p className="text-[10px] text-gray-500">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Description with Show more */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">About this place</h2>
              <DescriptionText text={unit.description} collapsedLines={3} />
            </div>

            {/* What this place offers (merged features) */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allOfferings.map((f) => (
                  <div key={f.label}
                    className="flex items-center gap-2.5 bg-brand-white border border-brand-light rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={FEATURE_ICONS[f.icon]} />
                    </svg>
                    <span className="text-xs text-gray-700 leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host card — richer */}
            <div className="rounded-2xl bg-brand-white border border-brand-light p-4 mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                  <Image src="/logo.jpg" alt="ASL Cozy Living" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Hosted by ASL Cozy Living</p>
                  <p className="text-xs text-brand-secondary font-medium">ASL Property Management</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Superhost
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>Responds in an hour</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-light text-xs">
                <div><p className="text-brand-secondary text-[10px] uppercase tracking-wide">Response</p><p className="font-semibold text-gray-700">98%</p></div>
                <div><p className="text-brand-secondary text-[10px] uppercase tracking-wide">Speaks</p><p className="font-semibold text-gray-700">English · Filipino</p></div>
                <div><p className="text-brand-secondary text-[10px] uppercase tracking-wide">Location</p><p className="font-semibold text-gray-700">Cebu, PH</p></div>
              </div>
            </div>

            {/* Reviews */}
            <ReviewsStrip />
          </div>

          {/* RIGHT — sticky booking widget */}
          <aside className="lg:sticky lg:top-24 min-w-0">
            <BookingForm unit={unit} />
          </aside>
        </div>

        {/* Explore other units */}
        {otherUnits.length > 0 && (
          <div className="mt-12 pt-8 border-t border-brand-light">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="text-brand-secondary text-xs font-semibold tracking-widest uppercase mb-1">
                  Also available
                </p>
                <h2 className="font-sans text-xl sm:text-2xl font-black text-gray-900">Explore other units</h2>
              </div>
              <Link href="/" className="text-xs font-semibold text-brand-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherUnits.slice(0, 3).map((u) => (
                <PropertyCard key={u.id} unit={u} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
