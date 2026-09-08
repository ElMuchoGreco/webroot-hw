import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, NotImplementedError } from "@/lib/errors";
import { MIN_ARTICLE_LENGTH } from "@/lib/briefing/validateInput";

const analyzeArticleMock = vi.fn();

vi.mock("@/lib/llm/openrouter", () => ({
  OpenRouterClient: vi.fn().mockImplementation(function OpenRouterClientMock() {
    return { analyzeArticle: analyzeArticleMock };
  }),
}));

// Imported after the mock above so route.ts picks up the mocked OpenRouterClient.
const { POST } = await import("@/app/api/analyze/route");

const validArticleText = "a".repeat(MIN_ARTICLE_LENGTH);

const validBriefing = {
  summary: "A summary of the article.",
  keyPoints: ["Point one"],
  entities: { people: ["Someone"], organizations: [], locations: [] },
  topics: ["Topic"],
  category: "Politics",
  checkableClaims: [],
};

function postRequest(body: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  analyzeArticleMock.mockReset();
});

describe("POST /api/analyze", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(postRequest("{not valid json"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(analyzeArticleMock).not.toHaveBeenCalled();
  });

  it("returns 400 for missing article text", async () => {
    const res = await POST(postRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(analyzeArticleMock).not.toHaveBeenCalled();
  });

  it("returns 400 and never calls the LLM for article text that is too short", async () => {
    const res = await POST(postRequest({ text: "too short" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(analyzeArticleMock).not.toHaveBeenCalled();
  });

  it("returns 501 when the LLM client is not configured/implemented", async () => {
    analyzeArticleMock.mockRejectedValueOnce(
      new NotImplementedError("OPENROUTER_API_KEY is not set.")
    );

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(501);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("NOT_IMPLEMENTED");
  });

  it("returns 502 when the upstream LLM request fails", async () => {
    analyzeArticleMock.mockRejectedValueOnce(new UpstreamError("OpenRouter request failed with status 500."));

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error.code).toBe("UPSTREAM_ERROR");
  });

  it("returns 504 when the request to the LLM times out", async () => {
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    analyzeArticleMock.mockRejectedValueOnce(abortErr);

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(504);
    expect(data.error.code).toBe("UPSTREAM_TIMEOUT");
  });

  it("returns 502 when the LLM returns unparseable/unexpected JSON shape", async () => {
    analyzeArticleMock.mockResolvedValueOnce({ notWhatWeExpected: true });

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error.code).toBe("PARSE_ERROR");
  });

  it("returns 502 when the LLM returns a value that is not JSON-shaped at all", async () => {
    analyzeArticleMock.mockResolvedValueOnce("just a plain string response");

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error.code).toBe("PARSE_ERROR");
  });

  it("returns 500 for an unexpected internal error without leaking internals", async () => {
    analyzeArticleMock.mockRejectedValueOnce(new Error("unexpected database connection error"));

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error.code).toBe("INTERNAL_ERROR");
    expect(data.error.message).not.toMatch(/database/i);
  });

  it("returns 200 with the parsed briefing on success", async () => {
    analyzeArticleMock.mockResolvedValueOnce(validBriefing);

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.briefing.summary).toBe(validBriefing.summary);
  });

  it("degrades gracefully (200) when the article has nothing for a given section", async () => {
    analyzeArticleMock.mockResolvedValueOnce({
      ...validBriefing,
      entities: { people: [], organizations: [], locations: [] },
      checkableClaims: [],
    });

    const res = await POST(postRequest({ text: validArticleText }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.briefing.entities.people).toEqual([]);
    expect(data.briefing.checkableClaims).toEqual([]);
  });
});
