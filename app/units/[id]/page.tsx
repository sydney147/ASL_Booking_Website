import { notFound } from 'next/navigation';
import Image from 'next/image';
import { fetchUnit } from '@/lib/units';
import BookingForm from '@/components/BookingForm';
import ImageGallery from '@/components/ImageGallery';
import { formatPHP } from '@/lib/rates';
import { UNIT_FEATURES, FEATURE_ICONS } from '@/lib/features';

const UNIT_IMAGES: Record<string, string[]> = {
  'room-2421': [
    '/2421/IMG_0954.JPG',
    '/2421/IMG_0951.JPG',
    '/2421/IMG_0952.JPG',
    '/2421/IMG_0897.jpg',
    '/2421/IMG_0896.jpg',
    '/2421/IMG_0963.jpg',
  ],
  'room-2621': [
    '/2621/IMG_1120.jpg',
    '/2621/IMG_1119.jpg',
    '/2621/IMG_1124.jpg',
    '/2621/IMG_1127.jpg',
    '/2621/IMG_1149.jpg',
    '/2621/IMG_0858.jpg',
  ],
};

export const dynamic = 'force-dynamic';


export default async function UnitBookingPage({ params }: { params: { id: string } }) {
  const unit = await fetchUnit(params.id);
  if (!unit) notFound();

  const features = UNIT_FEATURES[unit.id] ?? { room: [], building: [] };
  const images   = UNIT_IMAGES[unit.id] ?? [];

  const heroImage = unit.id === 'room-2421' ? '/IMG_0954.JPG' : '/IMG_1300.JPG';

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

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-5">
          <span className="text-brand-primary font-bold text-2xl">{formatPHP(unit.standardRate)}</span>
          <span className="text-sm text-gray-400">/night</span>
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
      </div>
    </div>
  );
}
