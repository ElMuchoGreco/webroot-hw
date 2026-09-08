"use client";

import { MAX_ARTICLE_LENGTH, MIN_ARTICLE_LENGTH } from "@/lib/briefing/validateInput";

interface ArticleFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ArticleForm({ value, onChange, onSubmit, disabled }: ArticleFormProps) {
  const length = value.trim().length;
  const tooShort = length > 0 && length < MIN_ARTICLE_LENGTH;
  const tooLong = length > MAX_ARTICLE_LENGTH;
  const canSubmit = !disabled && length >= MIN_ARTICLE_LENGTH && length <= MAX_ARTICLE_LENGTH;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="article-text" className="text-sm font-medium text-foreground">
        Article text
      </label>
      <textarea
        id="article-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the full text of the article here…"
        rows={16}
        className="w-full resize-y rounded-md border border-black/10 bg-white/50 p-3 font-mono text-sm leading-relaxed text-foreground shadow-sm outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-foreground/60">
          {length.toLocaleString()} / {MAX_ARTICLE_LENGTH.toLocaleString()} characters
          {tooShort && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              (minimum {MIN_ARTICLE_LENGTH})
            </span>
          )}
          {tooLong && <span className="ml-2 text-red-600 dark:text-red-400">(too long)</span>}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "Analyzing…" : "Analyze article"}
        </button>
      </div>
    </form>
  );
}
