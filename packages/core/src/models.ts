export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", contextWindow: 200_000, default: true },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", contextWindow: 200_000 },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", contextWindow: 200_000 },
] as const;

export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

/** Max codebase tokens = context window - output tokens - system prompt overhead - safety margin */
export function getMaxCodebaseTokens(modelId: string): number {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  const contextWindow = model?.contextWindow ?? 200_000;
  const outputTokens = 16_000;
  const systemOverhead = 8_000;
  const safetyMargin = 10_000; // extra buffer for estimation errors
  return contextWindow - outputTokens - systemOverhead - safetyMargin;
}
