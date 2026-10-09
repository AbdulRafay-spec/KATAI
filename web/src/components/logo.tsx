import { useId } from "react";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86bdff" />
          <stop offset="1" stopColor="#1f6fe8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <g fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8.6c-1.6-1.5-4.4-1.2-5.6.7-1.9.1-3.3 1.8-2.9 3.7-1.4.9-1.8 2.8-.8 4.1-.6 1.6.3 3.4 1.9 3.9.5 1.7 2.5 2.6 4.1 1.8 1.1 1 2.6 1.1 3.3.2z" />
        <path d="M16 8.6c1.6-1.5 4.4-1.2 5.6.7 1.9.1 3.3 1.8 2.9 3.7 1.4.9 1.8 2.8.8 4.1.6 1.6-.3 3.4-1.9 3.9-.5 1.7-2.5 2.6-4.1 1.8-1.1 1-2.6 1.1-3.3.2z" />
        <path d="M16 8.6v14.4" />
      </g>
      <path d="M4.5 16h23" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="1.5 2" opacity="0.75" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">KATAI</span>
    </span>
  );
}
