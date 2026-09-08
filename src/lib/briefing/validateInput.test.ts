import { describe, expect, it } from "vitest";

import {
  MAX_ARTICLE_LENGTH,
  MIN_ARTICLE_LENGTH,
  validateArticleText,
} from "@/lib/briefing/validateInput";

describe("validateArticleText", () => {
  it("rejects non-string input", () => {
    const result = validateArticleText(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/must be a string/i);
  });

  it("rejects an empty string", () => {
    const result = validateArticleText("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/required/i);
  });

  it("rejects whitespace-only input", () => {
    const result = validateArticleText("   \n\t  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/required/i);
  });

  it("rejects an article that does not contain enough information to analyze (too short)", () => {
    const result = validateArticleText("Short article.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/too short/i);
  });

  it("accepts text right at the minimum length", () => {
    const text = "a".repeat(MIN_ARTICLE_LENGTH);
    const result = validateArticleText(text);
    expect(result.ok).toBe(true);
  });

  it("rejects text over the maximum length", () => {
    const text = "a".repeat(MAX_ARTICLE_LENGTH + 1);
    const result = validateArticleText(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/too long/i);
  });

  it("accepts text right at the maximum length", () => {
    const text = "a".repeat(MAX_ARTICLE_LENGTH);
    const result = validateArticleText(text);
    expect(result.ok).toBe(true);
  });

  it("trims surrounding whitespace before validating and returns the trimmed text", () => {
    const inner = "a".repeat(MIN_ARTICLE_LENGTH);
    const result = validateArticleText(`  ${inner}  `);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe(inner);
  });
});
