import type { FilterRule } from "../types.js";

export const skillPromptFilter: FilterRule = {
  name: "skill-prompt",
  description: "Filter skill base directory prompts",
  shouldFilter: (text: string) => {
    return text.startsWith("Base directory for this skill:");
  },
};
