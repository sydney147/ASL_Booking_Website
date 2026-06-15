import Image from 'next/image';
import Link from 'next/link';
import { fetchUnits } from '@/lib/units';
import { formatPHP } from '@/lib/rates';
import { UNIT_FEATURES, FEATURE_ICONS } from '@/lib/features';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const units = await fetchUnits();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-brand-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-stretch gap-0 md:gap-12 md:min-h-[540px]">

            {/* Left: text + CTA */}
            <div className="order-1 md:order-1 md:w-1/2 flex flex-col justify-center pb-12 md:pb-16 pt-10 md:pt-16">
              <p className="text-brand-secondary text-xs font-semibold tracking-widest uppercase mb-4">
                Discover &middot; Explore &middot; Book
              </p>
              <h1 className="font-sans text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-4 sm:mb-5">
                Find Your<br />Perfect Home
              </h1>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xs">
                Explore top properties with ease. Search, compare, and connect trusted agents in one app.
              </p>
              <a
                href="#listings"
                className="inline-flex w-fit items-center gap-3 rounded-full bg-brand-primary
                           text-white px-8 py-4 text-sm font-semibold shadow-lg
                           hover:opacity-90 transition-all group"
              >
                Start Searching
                <span className="text-base group-hover:translate-x-1 transition-transform">&rarr;</span>
              </a>
            </div>

            {/* Right: photo */}
            <div className="order-2 md:order-2 md:w-1/2 flex items-center py-8 md:py-10">
              <div className="relative w-full h-64 sm:h-80 md:h-full md:min-h-[460px] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/hero.webp"
                  alt="Condo property"
                  fill
                  priority
                  className="object-cover object-center"
                />
                {/* floating badge — inside the image */}
                <div className="absolute bottom-4 left-4 bg-brand-white/90 backdrop-blur-sm
                                rounded-2xl px-4 py-2.5 shadow-md border border-brand-light">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Available now</p>
                  <p className="text-sm font-bold text-brand-primary">{units.length} Properties listed</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Explore ──────────────────────────────────────────── */}
      <section id="listings" className="bg-brand-bg border-t border-brand-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">

          {/* Section heading */}
          <div className="text-center mb-10">
            <p className="text-brand-secondary text-xs font-semibold tracking-widest uppercase mb-2">
              Available Units
            </p>
            <h2 className="font-sans text-3xl font-black text-gray-900">Our Properties</h2>
          </div>

          {/* Property grid — full-width 2-col */}
          <div className="grid gap-8 sm:grid-cols-2">
            {units.map((unit) => (
              <Link href={`/units/${unit.id}`} key={unit.id} className="group block">
                <article className="rounded-2xl bg-brand-white border border-brand-light
                                    overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  {/* Image area */}
                  <div className="relative h-72 bg-brand-light/60">
                    {unit.imageUrl && (
                      <Image
                        src={unit.imageUrl}
                        alt={unit.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <span className="absolute top-4 left-4 bg-brand-white text-brand-primary
                                     text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Apartment
                    </span>
                    <button
                      aria-label="Save property"
                      className="absolute top-4 right-4 w-9 h-9 bg-brand-white rounded-full
                                 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-brand-primary transition-colors">
                        {unit.name}
                      </h2>
                      <div className="text-right flex-shrink-0">
                        <span className="text-brand-primary font-bold text-lg">{formatPHP(unit.standardRate)}</span>
                        <span className="block text-xs font-normal text-gray-400">/night</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                      {unit.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{unit.address}</span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-brand-light">
                      {(UNIT_FEATURES[unit.id]?.room ?? []).slice(0, 4).map((f) => (
                        <div key={f.label}
                          className="flex items-center gap-1.5 bg-brand-bg border border-brand-light
                                     rounded-full px-3 py-1 text-xs text-gray-600">
                          <svg className="w-3 h-3 text-brand-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={FEATURE_ICONS[f.icon]} />
                          </svg>
                          {f.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
