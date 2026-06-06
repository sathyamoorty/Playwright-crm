/** One-line message for logs — avoids dumping Playwright error metadata (Symbol(step), etc.). */
export function formatErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.split('\n')[0]?.trim() || msg;
}
