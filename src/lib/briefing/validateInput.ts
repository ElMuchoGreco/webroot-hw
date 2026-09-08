export const MIN_ARTICLE_LENGTH = 200;
export const MAX_ARTICLE_LENGTH = 30_000;

export type InputValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

export function validateArticleText(raw: unknown): InputValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Article text must be a string." };
  }

  const text = raw.trim();

  if (text.length === 0) {
    return { ok: false, reason: "Article text is required." };
  }

  if (text.length < MIN_ARTICLE_LENGTH) {
    return {
      ok: false,
      reason: `Article text is too short to analyze meaningfully (minimum ${MIN_ARTICLE_LENGTH} characters).`,
    };
  }

  if (text.length > MAX_ARTICLE_LENGTH) {
    return {
      ok: false,
      reason: `Article text is too long (maximum ${MAX_ARTICLE_LENGTH.toLocaleString()} characters).`,
    };
  }

  return { ok: true, text };
}
