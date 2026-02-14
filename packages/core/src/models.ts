export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", default: true },
  { id: "claude-opus-4-6-20250514", label: "Claude Opus 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
] as const;

export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
