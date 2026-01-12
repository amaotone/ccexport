import type { FilterRule } from "../types.js";

export const noResponseFilter: FilterRule = {
  name: "no-response",
  description: "Filter 'No response requested' messages",
  shouldFilter: (text: string) => {
    return text.startsWith("No response requested");
  },
};
