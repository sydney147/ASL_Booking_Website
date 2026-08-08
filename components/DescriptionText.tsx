'use client';

import { useState } from 'react';

type Props = { text: string; collapsedLines?: number };

export default function DescriptionText({ text, collapsedLines = 3 }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        className={`text-gray-600 text-sm leading-relaxed transition-all ${
          expanded ? '' : `line-clamp-${collapsedLines}`
        }`}
        style={expanded ? undefined : {
          display: '-webkit-box',
          WebkitLineClamp: collapsedLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="mt-2 text-xs font-semibold text-brand-primary underline underline-offset-2 hover:text-brand-secondary transition-colors"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}
