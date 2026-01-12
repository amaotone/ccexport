import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import {
  parseMessage,
  shouldFilter,
  parseSessionFile,
  getClaudeProjectsDir,
  isSubagentSession,
  Message,
} from "./parser.js";

describe("session parser", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ccexport-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("parseMessage", () => {
    it("parses user message", () => {
      const line = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"質問内容"}}`;
      const msg = parseMessage(line);

      expect(msg?.type).toBe("user");
      expect(msg?.text).toBe("質問内容");
      expect(msg?.timestamp).toEqual(new Date("2026-01-12T01:30:00Z"));
    });

    it("parses assistant message with text array", () => {
      const line = `{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"回答内容"}]}}`;
      const msg = parseMessage(line);

      expect(msg?.type).toBe("assistant");
      expect(msg?.text).toBe("回答内容");
    });

    it("parses assistant message with multiple text blocks", () => {
      const line = `{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"first"},{"type":"text","text":"second"}]}}`;
      const msg = parseMessage(line);

      expect(msg?.text).toBe("first\nsecond");
    });

    it("returns null for invalid json", () => {
      const msg = parseMessage("{invalid}");
      expect(msg).toBeNull();
    });
  });

  describe("shouldFilter", () => {
    it("returns false for normal message", () => {
      expect(shouldFilter("TypeScriptでファイル監視する方法は？")).toBe(false);
    });

    it("returns true for system-reminder", () => {
      expect(shouldFilter("<system-reminder>some text</system-reminder>")).toBe(
        true
      );
    });

    it("returns true for local-command", () => {
      expect(shouldFilter("<local-command>ls</local-command>")).toBe(true);
    });

    it("returns true for command-name", () => {
      expect(shouldFilter("<command-name>/commit</command-name>")).toBe(true);
    });

    it("returns true for task-notification", () => {
      expect(shouldFilter("<task-notification>done</task-notification>")).toBe(
        true
      );
    });

    it("returns true for no response requested", () => {
      expect(shouldFilter("No response requested from assistant")).toBe(true);
    });

    it("returns true for message containing system-reminder", () => {
      expect(
        shouldFilter("text before <system-reminder>text</system-reminder> after")
      ).toBe(true);
    });
  });

  describe("parseSessionFile", () => {
    it("parses session file and filters messages", async () => {
      const sessionFile = join(tempDir, "session.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"質問内容"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"回答内容"}]}}
{"type":"user","timestamp":"2026-01-12T01:31:00Z","message":{"content":"<system-reminder>skip this</system-reminder>"}}
`;
      await writeFile(sessionFile, content);

      const messages = await parseSessionFile(sessionFile);

      expect(messages.length).toBe(2);
      expect(messages[0].text).toBe("質問内容");
      expect(messages[1].text).toBe("回答内容");
    });

    it("handles empty lines", async () => {
      const sessionFile = join(tempDir, "session.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"test"}}

{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"response"}]}}
`;
      await writeFile(sessionFile, content);

      const messages = await parseSessionFile(sessionFile);

      expect(messages.length).toBe(2);
    });
  });

  describe("getClaudeProjectsDir", () => {
    it("returns path to claude projects directory", () => {
      const expected = join(homedir(), ".claude", "projects");
      expect(getClaudeProjectsDir()).toBe(expected);
    });
  });

  describe("isSubagentSession", () => {
    it("returns false for regular session", () => {
      expect(
        isSubagentSession("/home/user/.claude/projects/-foo/session.jsonl")
      ).toBe(false);
    });

    it("returns true for subagent session", () => {
      expect(
        isSubagentSession(
          "/home/user/.claude/projects/-foo/subagents/session.jsonl"
        )
      ).toBe(true);
    });

    it("returns true for nested subagent session", () => {
      expect(
        isSubagentSession(
          "/home/user/.claude/projects/-foo/subagents/nested/session.jsonl"
        )
      ).toBe(true);
    });
  });
});
