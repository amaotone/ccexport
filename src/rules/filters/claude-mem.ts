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
    // Filter progress summary requests (claude-mem protocol)
    if (text.includes("you are a memory agent")) {
      return true;
    }
    // Filter summary output from claude-mem
    if (text.includes("<summary>")) {
      return true;
    }
    // Filter claude-mem status messages
    if (text.includes("observe the primary Claude session")) {
      return true;
    }
    // Filter claude-mem waiting/skip messages
    if (
      text.includes("I need to observe") ||
      text.includes("I'll wait for") ||
      text.includes("I'll skip this observation") ||
      text.includes("no observations to record") ||
      text.includes("nothing to record")
    ) {
      return true;
    }
    return false;
  },
};
