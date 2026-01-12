import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Message {
  type: "user" | "assistant";
  timestamp: Date;
  text: string;
}

interface AskUserQuestionOption {
  label: string;
  description: string;
}

interface AskUserQuestion {
  question: string;
  header: string;
  options: AskUserQuestionOption[];
}

interface ContentItem {
  type: string;
  text?: string;
  name?: string;
  input?: {
    questions?: AskUserQuestion[];
  };
  content?: string;
  tool_use_id?: string;
}

interface RawMessage {
  type: string;
  timestamp: string;
  message: {
    content: string | ContentItem[];
  };
}

const FILTER_PATTERNS = [
  "<system-reminder>",
  "<local-command",
  "<command-name>",
  "<task-notification>",
];

const FILTER_START_PATTERNS = [
  "No response requested",
  "You are a Claude-Mem, a specialized observer tool",
  "Base directory for this skill:",
];

export function parseMessage(line: string): Message | null {
  try {
    const raw: RawMessage = JSON.parse(line);
    const text = extractText(raw.message.content);

    return {
      type: raw.type as Message["type"],
      timestamp: new Date(raw.timestamp),
      text,
    };
  } catch {
    return null;
  }
}

function formatAskUserQuestion(questions: AskUserQuestion[]): string {
  return questions
    .map((q) => {
      const optionsText = q.options
        .map((opt) => `- ${opt.label}: ${opt.description}`)
        .join("\n");
      return `[Question: ${q.header}]\n${q.question}\n${optionsText}`;
    })
    .join("\n\n");
}

function extractAskUserAnswer(content: string): string | null {
  const match = content.match(/User has answered your questions:(.+?)(?:\. You can now continue|$)/);
  if (!match) {
    return null;
  }

  const rawAnswers = match[1].trim();
  // Parse "question"="answer" format and extract only answers
  const answerMatches = rawAnswers.matchAll(/"[^"]*"="([^"]*)"/g);
  const answers = Array.from(answerMatches, (m) => m[1]);

  if (answers.length === 0) {
    return null;
  }

  return `**Answer:** ${answers.join(", ")}`;
}

function extractText(content: string | ContentItem[]): string {
  if (typeof content === "string") {
    return content;
  }

  const parts: string[] = [];

  for (const item of content) {
    if (item.type === "text" && item.text) {
      parts.push(item.text);
    } else if (
      item.type === "tool_use" &&
      item.name === "AskUserQuestion" &&
      item.input?.questions
    ) {
      parts.push(formatAskUserQuestion(item.input.questions));
    } else if (item.type === "tool_result" && typeof item.content === "string") {
      const answer = extractAskUserAnswer(item.content);
      if (answer) {
        parts.push(answer);
      }
    }
  }

  return parts.join("\n");
}

export function shouldFilter(text: string): boolean {
  for (const pattern of FILTER_PATTERNS) {
    if (text.includes(pattern)) {
      return true;
    }
  }

  for (const pattern of FILTER_START_PATTERNS) {
    if (text.startsWith(pattern)) {
      return true;
    }
  }

  return false;
}

export async function parseSessionFile(path: string): Promise<Message[]> {
  const content = await readFile(path, "utf-8");
  const lines = content.split("\n");
  const messages: Message[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const msg = parseMessage(line);
    if (!msg) {
      continue;
    }

    if (msg.text.trim() === "") {
      continue;
    }

    if (shouldFilter(msg.text)) {
      continue;
    }

    messages.push(msg);
  }

  return messages;
}

export function getClaudeProjectsDir(): string {
  return join(homedir(), ".claude", "projects");
}

export function isSubagentSession(path: string): boolean {
  return path.includes("/subagents/");
}
