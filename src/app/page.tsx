"use client";

import { useState } from "react";

import { ArticleForm } from "@/components/ArticleForm";
import { BriefingResult } from "@/components/BriefingResult";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { ArticleBriefing } from "@/lib/briefing/schema";

type Status = "idle" | "loading" | "success" | "error";

interface AnalyzeSuccessResponse {
  ok: true;
  briefing: ArticleBriefing;
}

interface AnalyzeErrorResponse {
  ok: false;
  error: { code: string; message: string };
}

type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

export default function Home() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [briefing, setBriefing] = useState<ArticleBriefing | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function analyze() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = (await res.json()) as AnalyzeResponse;

      if (!data.ok) {
        setStatus("error");
        setErrorMessage(data.error.message);
        return;
      }

      setBriefing(data.briefing);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Check your connection and try again.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Article Intelligence</h1>
        <p className="text-sm text-foreground/60">
          Paste an article below to get an AI-generated briefing: summary, key points, entities,
          topics, and checkable claims.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ArticleForm
          value={text}
          onChange={setText}
          onSubmit={analyze}
          disabled={status === "loading"}
        />

        <div className="flex flex-col gap-4">
          {status === "idle" && (
            <p className="text-sm text-foreground/50">
              Your briefing will appear here once you submit an article.
            </p>
          )}

          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground"
              />
              Analyzing article…
            </div>
          )}

          {status === "error" && errorMessage && (
            <ErrorBanner message={errorMessage} onRetry={analyze} />
          )}

          {status === "success" && briefing && <BriefingResult briefing={briefing} />}
        </div>
      </div>
    </main>
  );
}
