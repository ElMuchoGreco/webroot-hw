# Article Intelligence

A small full-stack app where a user pastes an article and receives a structured, AI-generated briefing: summary, key points, named people/organizations/locations, topics, a suggested category, and potentially checkable claims.

Built for the "Article Intelligence" engineering take-home (see [task01.md](task01.md)); design rationale lives in [BRD.md](BRD.md).

## Getting started

Requirements: Node.js 20.9+ (Next.js 16 minimum).

```bash
npm install
cp .env.example .env.local
# then fill in OPENROUTER_API_KEY in .env.local — see "API key" below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API key

**No API key is included in this repository.** To analyze an article you must provide your own [OpenRouter](https://openrouter.ai/) API key:

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys).
2. Copy `.env.example` to `.env.local` (if you haven't already).
3. Set `OPENROUTER_API_KEY=<your key>` in `.env.local`.

`.env.local` is gitignored and will never be committed. Without a valid key, article submissions will fail with a clear "not configured" error rather than a silent failure — see `src/lib/llm/openrouter.ts`.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build (run `build` first)
npm run lint     # ESLint
npm test         # run the test suite once
```

## Technologies

- **Next.js 16** (App Router, TypeScript) — hosts both the React UI and the backend in one project, via a Route Handler for the API.
- **React 19** — client components for the form and result views.
- **Tailwind CSS 4** — styling.
- **Zod** — runtime validation of both the article-text input and the LLM's JSON output.
- **Vitest** — unit/integration tests.
- **OpenRouter** — LLM provider (OpenAI-compatible chat completions API).

## Approach to article analysis

The task left the briefing's content open-ended. The BRD ([BRD.md](BRD.md), FR2) defines the minimum useful set, implemented in [`src/lib/briefing/schema.ts`](src/lib/briefing/schema.ts):

- **Summary** — 2–4 sentence overview.
- **Key points** — the most important facts/developments.
- **Entities** — people, organizations, and locations, grouped by type.
- **Topics** and a suggested editorial **category**.
- **Checkable claims** — specific, factual statements extracted from the article. These are **not** fact-checked by the system — only surfaced for a human to verify.

The model is asked (via the system prompt in [`src/lib/llm/prompt.ts`](src/lib/llm/prompt.ts)) to return exactly this shape as JSON, grounded strictly in the article text, with empty arrays rather than invented content when a section has nothing to extract.

## Architectural & product decisions

- **One Next.js project for UI + backend.** The Route Handler at `src/app/api/analyze/route.ts` is the only backend endpoint; no separate server/CORS setup needed.
- **Provider-agnostic LLM client.** `src/lib/llm/types.ts` defines an `LlmClient` interface; `src/lib/llm/openrouter.ts` is the OpenRouter implementation. Swapping providers means writing a new implementation of that interface, not touching the route or UI.
- **LLM output is never trusted as-is.** The route parses the model's JSON response through the Zod schema. List fields use `.catch([])` so a malformed or missing section degrades to an empty state ("No entities found") instead of failing the entire request — the model's output is unreliable by nature and the UI should stay usable even when a section can't be extracted.
- **Typed error hierarchy → HTTP status mapping** (`src/lib/errors.ts`): invalid input → 400, unconfigured/not-implemented LLM client → 501, upstream failure → 502, unparseable LLM output → 502, timeout/abort → 504, anything unexpected → 500 with a generic message (no internal details leaked to the client).
- **30-second timeout** on the LLM call via `AbortController`, so a hung request doesn't leave the user waiting indefinitely.
- **Input bounds**: 200–30,000 characters. The lower bound rejects submissions too short to analyze meaningfully; the upper bound is a practical ceiling to keep cost/latency predictable, not derived from a specific model's context limit.

## Trade-offs & assumptions

- No authentication, persistence, or history — each analysis is a single stateless request, per the BRD's scope.
- No fact-checking of extracted claims — the app surfaces them for a human to verify, it does not verify them itself.
- Article text only (no URL fetching, PDFs, or images).
- Single LLM provider (OpenRouter) with no automatic fallback if it's unreachable — the timeout/error handling surfaces this clearly to the user instead.
- Not tuned for concurrent/production load; this is a scoped take-home, not a production service.

## Testing

`npm test` runs the Vitest suite, focused on the areas the brief calls out as highest-value (task01.md, "Reliability and quality"; BRD.md FR5/FR6):

- `src/lib/briefing/validateInput.test.ts` — input length/empty-string validation.
- `src/lib/briefing/schema.test.ts` — well-formed output accepted; malformed/incomplete LLM output degrades gracefully instead of failing; completely invalid output is rejected.
- `src/lib/errors.test.ts` — error → HTTP status mapping, including timeout/abort handling.
- `src/app/api/analyze/route.test.ts` — the full route's behavior for invalid input, a not-configured LLM client, upstream failures, timeouts, unparseable output, and success (mocks the LLM client so no real API calls are made).

## AI tools and coding agents

This project was built with **Claude Code** (Anthropic) as a hands-on coding agent throughout, following this sequence:

1. **Task analysis.** Read `task01.md` and produced [`BRD.md`](BRD.md), turning the open-ended brief into concrete scope, functional/non-functional requirements, and a defined briefing schema — the main ambiguous-requirement decision in the exercise.
2. **Implementation plan.** Agreed on a build order (UI → service layer → LLM integration) and the stack (Next.js/TypeScript, matching the developer's strongest languages) before writing code.
3. **UI & service layer.** Built the form, result view, error/loading states, the `/api/analyze` Route Handler, Zod schemas, and the typed error hierarchy. Since the scaffolded Next.js version (16) post-dates the agent's training data and ships with breaking changes, the agent read Next.js's own bundled docs (`node_modules/next/dist/docs/`) before writing App Router code, and verified each state (idle/loading/error/success) by driving the app in a real browser rather than assuming the code worked.
4. **LLM integration.** Designed a provider-agnostic `LlmClient` interface and the analysis prompt, then implemented the OpenRouter call.
5. **Tests for error cases.** Added a Vitest suite specifically targeting the reliability scenarios the brief calls out: invalid/incomplete input, malformed/unparseable LLM output, upstream failures, and timeouts.

**One thing changed after AI suggestion, and why:** the agent's initial `MAX_ARTICLE_LENGTH` (a judgment call, not a spec requirement) was 20,000 characters, reasoned as generous headroom over typical article length. This was changed to 30,000 after review, since 20,000 was an arbitrary AI-chosen default rather than a real constraint — a good example of why LLM-suggested numeric defaults should be treated as starting points to sanity-check, not settled decisions.

The agent was not given private prompts or full transcripts here, per the brief's guidance — this section summarizes what was used and for what.
