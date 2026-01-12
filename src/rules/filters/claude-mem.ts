import type { FilterRule } from "../types.js";

export const claudeMemFilter: FilterRule = {
  name: "claude-mem",
  description: "Filter claude-mem observer messages by stable protocol markers",
  shouldFilter: (text: string) => {
    // XML protocol tags (stable, part of claude-mem protocol)
    if (text.includes("<observed_from_primary_session>")) return true;
    if (text.includes("<observation>")) return true;
    if (text.includes("<summary>")) return true;

    // Core concept marker (stable, describes the fundamental relationship)
    if (text.includes("primary Claude session")) return true;

    return false;
  },
};
