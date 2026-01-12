import type { FilterRule } from "../types.js";

export const claudeMemFilter: FilterRule = {
  name: "claude-mem",
  description: "Filter claude-mem observer tool prompts and observations",
  shouldFilter: (text: string) => {
    // Filter claude-mem system prompts
    if (text.startsWith("You are a Claude-Mem, a specialized observer tool")) {
      return true;
    }
    // Filter memory agent continuation prompts
    if (
      text.startsWith(
        "Hello memory agent, you are continuing to observe the primary Claude session"
      )
    ) {
      return true;
    }
    // Filter claude-mem observation outputs
    if (text.includes("<observation>") && text.includes("</observation>")) {
      return true;
    }
    return false;
  },
};
