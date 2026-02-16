import { Ship, Monitor } from "lucide-react";

export function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile overlay — visible below md (768px) */}
      <div className="md:hidden fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg px-8 text-center">
        <div className="hero-glow absolute inset-0 pointer-events-none" />

        <div className="flex items-center gap-2">
          <Ship className="w-7 h-7 text-accent" />
          <span className="text-xl" style={{ fontFamily: "Menlo, Monaco, 'Courier New', monospace", letterSpacing: "0.04em" }}>Shipwell</span>
        </div>
        <p className="text-sm text-text-muted">Full Codebase Autopilot</p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Monitor className="h-8 w-8 text-accent" />
          <p className="text-sm font-medium text-text">
            Shipwell is designed for desktop.
          </p>
          <p className="text-xs text-text-muted max-w-[280px]">
            Please open on a larger screen for the full experience.
          </p>
        </div>
      </div>

      {/* Desktop wrapper — hidden below md, passes through children at md+ */}
      <div className="hidden md:contents">{children}</div>
    </>
  );
}
