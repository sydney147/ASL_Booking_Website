import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchUnit, fetchUnits } from '@/lib/units';
import BookingForm from '@/components/BookingForm';
import ImageGallery from '@/components/ImageGallery';
import PropertyCard from '@/components/PropertyCard';
import { formatPHP } from '@/lib/rates';
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

  const heroImage = unit.imageUrl;

  return (
    <div>
      {/* ── Full-width hero banner ─────────────────────────── */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden">
        <Image
          src={heroImage}
          alt={unit.name}
          fill
          priority
          className="object-cover object-center"
        />
        {/* Gradient for bottom text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button — top left */}
        <a href="/"
          className="absolute top-4 left-4 sm:left-8 inline-flex items-center gap-1.5
                     bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors
                     text-white text-xs font-medium px-3 py-1.5 rounded-full">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>

        {/* Unit name + address — bottom left */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-8 sm:right-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-white leading-tight drop-shadow-md">
            {unit.name}
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 drop-shadow leading-snug">{unit.address}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-5 sm:py-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">{unit.name}</span>
        </nav>

        {/* Price + quick specs */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-brand-primary font-bold text-2xl">{formatPHP(unit.standardRate)}</span>
          <span className="text-sm text-gray-400">/night</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-semibold text-gray-700">4.9</span>
          <span>(24 reviews)</span>
          <span className="text-gray-300">·</span>
          <span>Up to {unit.maxGuests} guests</span>
          {unit.petsFriendly && (
            <>
              <span className="text-gray-300">·</span>
              <span>Pet-friendly</span>
            </>
          )}
        </div>

        <ImageGallery images={images} alt={unit.name} />

      {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{unit.description}</p>

        {/* Room Features */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Room Features</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {features.room.map((f) => (
              <div key={f.label}
                className="flex items-center gap-3 bg-brand-bg border border-brand-light rounded-xl px-4 py-3">
                <svg className="w-5 h-5 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={FEATURE_ICONS[f.icon]} />
                </svg>
                <span className="text-sm text-gray-700">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Building Amenities */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Building Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {features.building.map((f) => (
              <div key={f.label}
                className="flex items-center gap-2 bg-brand-bg border border-brand-light rounded-full px-4 py-2">
                <svg className="w-4 h-4 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={FEATURE_ICONS[f.icon]} />
                </svg>
                <span className="text-xs text-gray-600">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Host info */}
        <div className="flex items-center gap-4 p-4 bg-brand-bg border border-brand-light rounded-2xl mb-8">
          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
            <Image src="/logo.jpg" alt="ASL Cozy Living" fill className="object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">ASL Cozy Living</p>
            <p className="text-xs text-brand-secondary font-medium">ASL Property Management</p>
          </div>
        </div>

        {/* Booking Form */}
        <BookingForm unit={unit} />

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
