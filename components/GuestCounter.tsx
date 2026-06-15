'use client';

type Props = {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
};

export default function GuestCounter({ label, hint, value, min = 0, max = 20, onChange }: Props) {
  return (
    <div className="flex items-center justify-between py-3 sm:py-2">
      <div>
        <div className="font-medium text-gray-800 text-sm sm:text-base">{label}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
      <div className="flex items-center gap-3 sm:gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-gray-300 text-lg leading-none
                     flex items-center justify-center
                     hover:border-brand-primary hover:text-brand-primary
                     disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Decrease ${label}`}
        >
          &minus;
        </button>
        <span className="w-7 sm:w-6 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-gray-300 text-lg leading-none
                     flex items-center justify-center
                     hover:border-brand-primary hover:text-brand-primary
                     disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
