// Brand palette: brand-light #d6e0e7 → brand-secondary #587d89 → brand-primary #41224A.
// Five-stop gradient so the wave fades from soft to deep, left to right.
const DOT_COLORS = ['#d6e0e7', '#a8b9c3', '#587d89', '#4d4868', '#41224A'];

export default function UnitLoading() {
  return (
    <div className="bg-brand-bg min-h-[70vh] flex flex-col items-center justify-center px-5">
      <div className="flex items-end gap-2.5 mb-6 h-10">
        {DOT_COLORS.map((color, i) => (
          <span
            key={i}
            className="inline-block w-3.5 h-3.5 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 4px 10px ${color}55`,
              animation: 'wave-dot 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <p className="text-sm font-medium tracking-wide text-brand-primary/80">
        Cozying up the unit...
      </p>
    </div>
  );
}
