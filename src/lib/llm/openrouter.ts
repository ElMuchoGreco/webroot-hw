import { NotImplementedError, ParseError, UpstreamError } from "@/lib/errors";
import {
  ARTICLE_BRIEFING_SYSTEM_PROMPT,
  buildArticleBriefingUserPrompt,
} from "@/lib/llm/prompt";
import type { LlmClient } from "@/lib/llm/types";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class OpenRouterClient implements LlmClient {
  async analyzeArticle(articleText: string, signal: AbortSignal): Promise<unknown> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new NotImplementedError(
        "OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example)."
      );
    }

    const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
    const systemPrompt = ARTICLE_BRIEFING_SYSTEM_PROMPT;
    const userPrompt = buildArticleBriefingUserPrompt(articleText);

    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      throw new UpstreamError("Failed to reach OpenRouter.");
    }

    if (!res.ok) {
      throw new UpstreamError(`OpenRouter request failed with status ${res.status}.`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new UpstreamError("OpenRouter response did not include message content.");
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new ParseError();
    }
  }
}
