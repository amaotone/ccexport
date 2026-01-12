import type { FilterRule } from "../types.js";
import { systemTagsFilter } from "./system-tags.js";
import { skillPromptFilter } from "./skill-prompt.js";
import { noResponseFilter } from "./no-response.js";

export const defaultFilters: FilterRule[] = [
  systemTagsFilter,
  skillPromptFilter,
  noResponseFilter,
];

export { systemTagsFilter, skillPromptFilter, noResponseFilter };
