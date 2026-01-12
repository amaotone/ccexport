import type { TransformerRule } from "../types.js";

export const textExtractTransformer: TransformerRule = {
  name: "text-extract",
  description: "Extract text content from text type items",
  transform: (item) => {
    if (item.type === "text" && item.text) {
      return item.text;
    }
    return null;
  },
};
