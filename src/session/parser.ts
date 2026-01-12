import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Message {
  type: "user" | "assistant";
  timestamp: Date;
  text: string;
}

interface ContentItem {
  type: string;
  text?: string;
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

function extractText(content: string | ContentItem[]): string {
  if (typeof content === "string") {
    return content;
  }

  const texts = content
    .filter((item) => item.type === "text" && item.text)
    .map((item) => item.text!);

  return texts.join("\n");
}

export function shouldFilter(text: string): boolean {
  for (const pattern of FILTER_PATTERNS) {
    if (text.includes(pattern)) {
      return true;
    }
  }

  if (text.startsWith("No response requested")) {
    return true;
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
