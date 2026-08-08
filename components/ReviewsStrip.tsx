// Mock reviews. Replace with real data once you wire up a reviews collection.

type Review = {
  name: string;
  date: string;
  rating: number;
  text: string;
};

const MOCK_REVIEWS: Review[] = [
  {
    name: 'Maria S.',
    date: 'March 2026',
    rating: 5,
    text: 'The unit was spotless and the host was very accommodating. Amazing view of the city at night!',
  },
  {
    name: 'Kevin L.',
    date: 'February 2026',
    rating: 5,
    text: 'Perfect location right in the middle of IT Park. Walking distance to great restaurants.',
  },
  {
    name: 'Anna R.',
    date: 'January 2026',
    rating: 4,
    text: 'Cozy and comfortable stay. The Smart TV with Netflix was a nice touch. Would book again.',
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < n ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsStrip() {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          4.9 · 24 reviews
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_REVIEWS.map(r => (
          <div key={r.name} className="rounded-2xl bg-brand-white border border-brand-light p-4 shadow-sm">
            <Stars n={r.rating} />
            <p className="text-sm text-gray-700 leading-relaxed mt-2 mb-3 line-clamp-4">
              &ldquo;{r.text}&rdquo;
            </p>
            <div className="text-xs">
              <p className="font-semibold text-gray-900">{r.name}</p>
              <p className="text-brand-secondary">{r.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
