import { NotImplementedError } from "@/lib/errors";
import type { LlmClient } from "@/lib/llm/types";

// Referenced in the TODO below: ARTICLE_BRIEFING_SYSTEM_PROMPT, buildArticleBriefingUserPrompt
// from "@/lib/llm/prompt", and UpstreamError / ParseError from "@/lib/errors".
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class OpenRouterClient implements LlmClient {
  async analyzeArticle(_articleText: string, _signal: AbortSignal): Promise<unknown> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new NotImplementedError(
        "OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example)."
      );
    }

    // TODO: implement the OpenRouter call.
    //
    // OpenRouter's chat completions endpoint is OpenAI-compatible. A typical call:
    //
    // const res = await fetch(OPENROUTER_URL, {
    //   method: "POST",
    //   signal,
    //   headers: {
    //     Authorization: `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    //     messages: [
    //       { role: "system", content: ARTICLE_BRIEFING_SYSTEM_PROMPT },
    //       { role: "user", content: buildArticleBriefingUserPrompt(articleText) },
    //     ],
    //     response_format: { type: "json_object" },
    //   }),
    // });
    //
    // if (!res.ok) throw new UpstreamError(`OpenRouter request failed: ${res.status}`);
    //
    // const data = await res.json();
    // const content = data.choices?.[0]?.message?.content;
    // if (typeof content !== "string") throw new UpstreamError("OpenRouter returned no content.");
    //
    // try {
    //   return JSON.parse(content);
    // } catch {
    //   throw new ParseError();
    // }
    //
    // The result is passed to `articleBriefingSchema.safeParse` by the caller,
    // so it just needs to be the parsed JSON body — no need to validate shape here.

    throw new NotImplementedError(
      "OpenRouterClient.analyzeArticle is not implemented yet. Fill in the fetch call in src/lib/llm/openrouter.ts."
    );
  }
}
