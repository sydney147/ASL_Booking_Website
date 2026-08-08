// Fixed ambient background — pastel color blobs + soft-petal flower silhouettes
// give the page personality without being loud. Pinned to viewport
// (fixed position), non-interactive (pointer-events: none), sits behind
// everything via -z-10.

const FLOWER_PATH =
  // Simple 6-petal flower centered at (50, 50), radius 50
  'M50 5 C58 15, 68 22, 78 22 C86 22, 92 30, 88 40 C84 48, 88 60, 96 66 C102 72, 98 82, 88 82 C78 82, 68 90, 62 96 C56 100, 46 96, 44 88 C42 80, 32 76, 22 76 C14 76, 8 68, 12 60 C16 52, 12 42, 6 34 C2 28, 6 20, 14 20 C22 20, 32 12, 38 6 C42 2, 48 3, 50 5 Z';

function Flower({
  className,
  color,
  rotation = 0,
  opacity = 0.15,
}: {
  className: string;
  color: string;
  rotation?: number;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`absolute ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity,
        filter: 'blur(2px)',
      }}
      aria-hidden="true"
    >
      <path d={FLOWER_PATH} fill={color} />
      {/* Small center */}
      <circle cx="50" cy="50" r="12" fill={color} opacity="0.6" />
    </svg>
  );
}

export default function BackgroundDecoration() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* ── Blurred earthy blobs (color wash) ────────────────── */}
      <div
        className="absolute rounded-full bg-brand-blush opacity-80 blur-3xl"
        style={{ top: '-8rem', right: '-8rem', width: '32rem', height: '32rem' }}
      />
      <div
        className="absolute rounded-full bg-brand-light opacity-70 blur-3xl"
        style={{ bottom: '-8rem', left: '-8rem', width: '30rem', height: '30rem' }}
      />
      <div
        className="absolute rounded-full bg-brand-cream opacity-80 blur-3xl"
        style={{ top: '40%', right: '15%', width: '20rem', height: '20rem' }}
      />
      <div
        className="absolute rounded-full bg-brand-accent/25 blur-3xl"
        style={{ top: '-6rem', left: '20%', width: '18rem', height: '18rem' }}
      />
      <div
        className="absolute rounded-full bg-brand-blush opacity-60 blur-3xl"
        style={{ top: '60%', left: '5%', width: '22rem', height: '22rem' }}
      />

      {/* ── Soft-petal flower silhouettes (earthy palette) ───── */}
      <Flower
        className="top-8 -right-16 w-96 h-96"
        color="#C97B63"    // terracotta
        rotation={-20}
        opacity={0.18}
      />
      <Flower
        className="top-1/3 -left-24 w-[28rem] h-[28rem]"
        color="#D7C7AE"    // sandstone beige
        rotation={40}
        opacity={0.28}
      />
      <Flower
        className="bottom-0 right-1/4 w-72 h-72"
        color="#A85E46"    // deep clay
        rotation={-10}
        opacity={0.14}
      />
      <Flower
        className="-bottom-16 -left-8 w-80 h-80"
        color="#EDDBC7"    // warm beige
        rotation={65}
        opacity={0.35}
      />
      <Flower
        className="top-2/3 right-8 w-64 h-64 hidden sm:block"
        color="#5B4A3B"    // dark cocoa
        rotation={20}
        opacity={0.10}
      />
    </div>
  );
}
