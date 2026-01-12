import type { FilterRule } from "../types.js";

export const claudeMemFilter: FilterRule = {
  name: "claude-mem",
  description: "Filter claude-mem observer tool prompts",
  shouldFilter: (text: string) => {
    return text.startsWith(
      "You are a Claude-Mem, a specialized observer tool"
    );
  },
};
