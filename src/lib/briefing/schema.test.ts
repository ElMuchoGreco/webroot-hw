import { describe, expect, it } from "vitest";

import { articleBriefingSchema } from "@/lib/briefing/schema";

const validBriefing = {
  summary: "A city council approved a new transit budget.",
  keyPoints: ["Budget approved", "Construction starts in spring"],
  entities: {
    people: ["Jane Smith"],
    organizations: ["Department of Transportation"],
    locations: ["Downtown"],
  },
  topics: ["Transportation", "Local government"],
  category: "Politics",
  checkableClaims: ["The budget is $40 million."],
};

describe("articleBriefingSchema", () => {
  it("accepts a well-formed briefing", () => {
    const result = articleBriefingSchema.safeParse(validBriefing);
    expect(result.success).toBe(true);
  });

  it("rejects completely unexpected/invalid output (not an object)", () => {
    const result = articleBriefingSchema.safeParse("not json at all");
    expect(result.success).toBe(false);
  });

  it("rejects output missing the required summary (incomplete response)", () => {
    const { summary: _summary, ...rest } = validBriefing;
    const result = articleBriefingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty summary", () => {
    const result = articleBriefingSchema.safeParse({ ...validBriefing, summary: "" });
    expect(result.success).toBe(false);
  });

  it("degrades gracefully when an article lacks entities for a section (empty arrays are valid)", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      entities: { people: [], organizations: [], locations: [] },
      keyPoints: [],
      topics: [],
      checkableClaims: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entities.people).toEqual([]);
      expect(result.data.keyPoints).toEqual([]);
      expect(result.data.checkableClaims).toEqual([]);
    }
  });

  it("falls back to an empty array when a list field has the wrong type instead of failing the whole response", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      keyPoints: "not an array",
      topics: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyPoints).toEqual([]);
      expect(result.data.topics).toEqual([]);
    }
  });

  it("falls back to an empty entities object when entities is malformed", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      entities: "not an object",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entities).toEqual({ people: [], organizations: [], locations: [] });
    }
  });

  it("falls back to a default category when category is missing or invalid", () => {
    const { category: _category, ...rest } = validBriefing;
    const result = articleBriefingSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Uncategorized");
    }
  });

  it("ignores unexpected extra fields from the model instead of failing", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      unexpectedField: "the model made this up",
    });
    expect(result.success).toBe(true);
  });

  it("filters out blank strings inside list fields rather than failing the whole response", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      keyPoints: ["Valid point", "", "Another point"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyPoints).toEqual(["Valid point", "Another point"]);
    }
  });

  it("trims whitespace from list entries", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      keyPoints: ["  Padded point  "],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyPoints).toEqual(["Padded point"]);
    }
  });

  it("filters out non-string entries inside list fields", () => {
    const result = articleBriefingSchema.safeParse({
      ...validBriefing,
      keyPoints: ["Valid point", 42, null],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyPoints).toEqual(["Valid point"]);
    }
  });
});
