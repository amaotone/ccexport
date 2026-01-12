import type { FilterRule } from "../types.js";
import { systemTagsFilter } from "./system-tags.js";
import { claudeMemFilter } from "./claude-mem.js";
import { skillPromptFilter } from "./skill-prompt.js";
import { noResponseFilter } from "./no-response.js";

export const defaultFilters: FilterRule[] = [
  systemTagsFilter,
  claudeMemFilter,
  skillPromptFilter,
  noResponseFilter,
];

export {
  systemTagsFilter,
  claudeMemFilter,
  skillPromptFilter,
  noResponseFilter,
};
