'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Gaze/cursor-aware container: a soft gold spotlight tracks the pointer across
 * the surface (via CSS vars consumed by `.spotlight` in globals.css).
 */
export function SpotlightCard({
  children,
  className = '',
  style,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const Tag = as;
  return (
    <Tag ref={ref} onMouseMove={onMove} className={`spotlight ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** The Iconic Founders Group mountain, as crisp inline SVG (gold gradient). */
export function MountainMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  const w = size;
  const h = Math.round(size * 0.62);
  const id = `ifg-mtn-${size}`;
  return (
    <svg width={w} height={h} viewBox="0 0 420 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4af60" />
          <stop offset="0.5" stopColor="#c9a044" />
          <stop offset="1" stopColor="#8a6d26" />
        </linearGradient>
      </defs>
      <path d="M0 200 L82 92 L120 138 L200 36 L262 118 L308 82 L420 200 Z" fill={`url(#${id})`} />
    </svg>
  );
}
