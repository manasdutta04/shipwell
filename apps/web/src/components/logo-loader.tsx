"use client";

export function LogoLoader({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-draw"
      >
        {/* Ship icon paths from lucide — drawn with stroke animation */}
        {/* Hull */}
        <path
          d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-path logo-path-1"
        />
        {/* Boat body */}
        <path
          d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-path logo-path-2"
        />
        {/* Mast */}
        <path
          d="M12 2v10"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-path logo-path-3"
        />
        {/* Sail */}
        <path
          d="M12 4l7 6"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-path logo-path-4"
        />
        <path
          d="M12 8l-3 2"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-path logo-path-5"
        />
      </svg>
    </div>
  );
}
