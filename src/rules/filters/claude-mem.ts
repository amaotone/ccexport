import type { FilterRule } from "../types.js";

export const claudeMemFilter: FilterRule = {
  name: "claude-mem",
  description: "Filter claude-mem observer messages by XML protocol tags",
  shouldFilter: (text: string) => {
    // Filter messages containing observed_from_primary_session (input to claude-mem)
    if (text.includes("<observed_from_primary_session>")) {
      return true;
    }
    // Filter messages containing observation tags (output from claude-mem)
    if (text.includes("<observation>")) {
      return true;
    }
    return false;
  },
};
