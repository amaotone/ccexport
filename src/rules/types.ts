export interface ContentItem {
  type: string;
  text?: string;
  name?: string;
  input?: {
    questions?: AskUserQuestion[];
  };
  content?: string;
  tool_use_id?: string;
}

export interface AskUserQuestionOption {
  label: string;
  description: string;
}

export interface AskUserQuestion {
  question: string;
  header: string;
  options: AskUserQuestionOption[];
}

export interface RawMessage {
  type: string;
  timestamp: string;
  userType?: string;
  message: {
    content: string | ContentItem[];
  };
}

/**
 * Filter rule determines whether a message should be excluded from export.
 */
export interface FilterRule {
  name: string;
  description: string;
  /** Returns true if the message should be filtered out */
  shouldFilter: (text: string) => boolean;
}

/**
 * Transformer rule extracts or transforms content from a ContentItem.
 */
export interface TransformerRule {
  name: string;
  description: string;
  /** Returns transformed text, or null if this rule doesn't apply */
  transform: (item: ContentItem) => string | null;
}
