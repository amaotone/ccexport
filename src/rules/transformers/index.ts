import type { TransformerRule } from "../types.js";
import { textExtractTransformer } from "./text-extract.js";
import { askUserQuestionTransformer } from "./ask-user-question.js";

// Order matters: more specific transformers should come first
export const defaultTransformers: TransformerRule[] = [
  askUserQuestionTransformer,
  textExtractTransformer,
];

export { textExtractTransformer, askUserQuestionTransformer };
