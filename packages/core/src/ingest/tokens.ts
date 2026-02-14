/**
 * Fast token estimation. Uses ~3.2 chars per token which is conservative
 * for code (accounts for whitespace, keywords, symbols). Better to
 * overcount than undercount and hit context limits.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.2);
}
