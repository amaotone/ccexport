import type { FilterRule, TransformerRule, ContentItem } from "./types.js";
import { defaultFilters } from "./filters/index.js";
import { defaultTransformers } from "./transformers/index.js";

export interface RuleEngine {
  filters: FilterRule[];
  transformers: TransformerRule[];
}

export function createRuleEngine(
  filters: FilterRule[] = defaultFilters,
  transformers: TransformerRule[] = defaultTransformers
): RuleEngine {
  return { filters, transformers };
}

/**
 * Check if text should be filtered out based on filter rules.
 */
export function shouldFilter(engine: RuleEngine, text: string): boolean {
  return engine.filters.some((filter) => filter.shouldFilter(text));
}

/**
 * Extract text from content using transformer rules.
 */
export function extractText(
  engine: RuleEngine,
  content: string | ContentItem[]
): string {
  if (typeof content === "string") {
    return content;
  }

  const parts: string[] = [];

  for (const item of content) {
    for (const transformer of engine.transformers) {
      const result = transformer.transform(item);
      if (result !== null) {
        parts.push(result);
        break; // First matching transformer wins
      }
    }
  }

  return parts.join("\n");
}

// Default engine instance for convenience
export const defaultEngine = createRuleEngine();
