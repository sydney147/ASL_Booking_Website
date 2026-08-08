import Image from 'next/image';
import { fetchUnits } from '@/lib/units';
import PropertyList from '@/components/PropertyList';

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
      <section id="listings" className="bg-brand-bg border-t border-brand-light overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">

          {/* Section heading */}
          <div className="text-center mb-10">
            <p className="text-brand-secondary text-xs font-semibold tracking-widest uppercase mb-2">
              Available Units
            </p>
            <h2 className="font-sans text-3xl font-black text-gray-900">Our Properties</h2>
          </div>

          {/* Property list — client component with filters + sort */}
          <PropertyList units={units} />
        </div>
      </section>
    </div>
  );
}
