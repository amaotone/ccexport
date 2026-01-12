import type { FilterRule } from "../types.js";

const SYSTEM_TAG_PATTERNS = [
  "<system-reminder>",
  "<local-command",
  "<command-name>",
  "<task-notification>",
];

export const systemTagsFilter: FilterRule = {
  name: "system-tags",
  description: "Filter messages containing Claude Code system tags",
  shouldFilter: (text: string) => {
    return SYSTEM_TAG_PATTERNS.some((pattern) => text.includes(pattern));
  },
};
