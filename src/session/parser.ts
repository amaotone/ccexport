import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  defaultEngine,
  shouldFilter as engineShouldFilter,
  extractText as engineExtractText,
  type RawMessage,
} from "../rules/index.js";

export interface Message {
  type: "user" | "assistant";
  timestamp: Date;
  text: string;
}

export function parseMessage(line: string): Message | null {
  try {
    const raw: RawMessage = JSON.parse(line);
    const text = engineExtractText(defaultEngine, raw.message.content);

    return {
      type: raw.type as Message["type"],
      timestamp: new Date(raw.timestamp),
      text,
    };
  } catch {
    return null;
  }
}

export function shouldFilter(text: string): boolean {
  return engineShouldFilter(defaultEngine, text);
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
