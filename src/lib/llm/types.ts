/**
 * Provider-agnostic contract for the article-analysis LLM call.
 * Implementations must return the raw parsed JSON body from the model —
 * validation against `articleBriefingSchema` happens in the API route,
 * not here, so this layer stays swappable per provider.
 */
export interface LlmClient {
  analyzeArticle(articleText: string, signal: AbortSignal): Promise<unknown>;
}
