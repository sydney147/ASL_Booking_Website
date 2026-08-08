// Fixed ambient background — three heavily-blurred pastel blobs that read as
// out-of-focus flowers. Pinned to the viewport (fixed position), non-interactive
// (pointer-events: none), sits behind everything else via -z-10.
//
// Colors deliberately match the brand palette so the effect blends in rather
// than competing with content.

export default function BackgroundDecoration() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Top-right blush pink — the biggest, softest hint */}
      <div
        className="absolute rounded-full bg-brand-blush opacity-70 blur-3xl"
        style={{ top: '-8rem', right: '-8rem', width: '32rem', height: '32rem' }}
      />

      {/* Bottom-left pale lavender */}
      <div
        className="absolute rounded-full bg-brand-light opacity-70 blur-3xl"
        style={{ bottom: '-8rem', left: '-8rem', width: '30rem', height: '30rem' }}
      />

      {/* Middle-right cream warmth — smaller accent */}
      <div
        className="absolute rounded-full bg-brand-cream opacity-60 blur-3xl"
        style={{ top: '40%', right: '15%', width: '20rem', height: '20rem' }}
      />

      {/* Off-screen extra lavender on the top-left for asymmetry */}
      <div
        className="absolute rounded-full bg-brand-secondary/30 blur-3xl"
        style={{ top: '-6rem', left: '20%', width: '18rem', height: '18rem' }}
      />
    </div>
  );
}
