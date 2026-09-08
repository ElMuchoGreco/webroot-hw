import { NextResponse } from "next/server";

import { articleBriefingSchema } from "@/lib/briefing/schema";
import { validateArticleText } from "@/lib/briefing/validateInput";
import { AppError, InvalidInputError, ParseError, toAppError } from "@/lib/errors";
import { OpenRouterClient } from "@/lib/llm/openrouter";
import type { LlmClient } from "@/lib/llm/types";

const ANALYSIS_TIMEOUT_MS = 30_000;

const llmClient: LlmClient = new OpenRouterClient();

function errorResponse(error: AppError) {
  return NextResponse.json(
    { ok: false, error: { code: error.code, message: error.message } },
    { status: error.httpStatus }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new InvalidInputError("Request body must be valid JSON."));
  }

  const { text } = (body ?? {}) as { text?: unknown };
  const validation = validateArticleText(text);
  if (!validation.ok) {
    return errorResponse(new InvalidInputError(validation.reason));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const raw = await llmClient.analyzeArticle(validation.text, controller.signal);

    const parsed = articleBriefingSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(new ParseError());
    }

    return NextResponse.json({ ok: true, briefing: parsed.data });
  } catch (err) {
    return errorResponse(toAppError(err));
  } finally {
    clearTimeout(timeout);
  }
}
