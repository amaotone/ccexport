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
  isClaudeMemObserverSession,
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

    it("extracts AskUserQuestion tool_use as formatted question", () => {
      const toolUse = {
        type: "tool_use",
        name: "AskUserQuestion",
        input: {
          questions: [
            {
              question: "Which option do you prefer?",
              header: "Option",
              options: [
                { label: "Option A", description: "First choice" },
                { label: "Option B", description: "Second choice" },
              ],
            },
          ],
        },
      };
      const line = JSON.stringify({
        type: "assistant",
        timestamp: "2026-01-12T01:30:05Z",
        message: {
          content: [{ type: "text", text: "Let me ask:" }, toolUse],
        },
      });
      const msg = parseMessage(line);

      expect(msg?.text).toContain("Let me ask:");
      expect(msg?.text).toContain("**Question: Option**");
      expect(msg?.text).toContain("Which option do you prefer?");
      expect(msg?.text).toContain("- Option A: First choice");
      expect(msg?.text).toContain("- Option B: Second choice");
    });

    it("extracts AskUserQuestion tool_result as user response", () => {
      const toolResult = {
        type: "tool_result",
        tool_use_id: "toolu_123",
        content:
          'User has answered your questions: "Which option?"="Option A". You can now continue.',
      };
      const line = JSON.stringify({
        type: "user",
        timestamp: "2026-01-12T01:30:10Z",
        message: {
          content: [toolResult],
        },
      });
      const msg = parseMessage(line);

      expect(msg?.text).toBe("**Answer:** Option A");
    });

    it("extracts multiple AskUserQuestion answers", () => {
      const toolResult = {
        type: "tool_result",
        tool_use_id: "toolu_123",
        content:
          'User has answered your questions: "Target?"="Engineers", "Type?"="Technical docs". You can now continue.',
      };
      const line = JSON.stringify({
        type: "user",
        timestamp: "2026-01-12T01:30:10Z",
        message: {
          content: [toolResult],
        },
      });
      const msg = parseMessage(line);

      expect(msg?.text).toBe("**Answer:** Engineers, Technical docs");
    });

    it("ignores other tool_use types", () => {
      const toolUse = {
        type: "tool_use",
        name: "Bash",
        input: { command: "ls -la" },
      };
      const line = JSON.stringify({
        type: "assistant",
        timestamp: "2026-01-12T01:30:05Z",
        message: {
          content: [{ type: "text", text: "Running command" }, toolUse],
        },
      });
      const msg = parseMessage(line);

      expect(msg?.text).toBe("Running command");
      expect(msg?.text).not.toContain("ls -la");
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

    it("returns true for skill base directory prompt", () => {
      expect(
        shouldFilter("Base directory for this skill: /Users/user/.claude/skills/dev-advisor")
      ).toBe(true);
    });

    it("returns true for claude-mem observed_from_primary_session", () => {
      expect(
        shouldFilter(
          "Hello memory agent\n<observed_from_primary_session>\n  <user_request>test</user_request>\n</observed_from_primary_session>"
        )
      ).toBe(true);
    });

    it("returns true for claude-mem observation output", () => {
      expect(
        shouldFilter("<observation>\n  <type>change</type>\n  <title>Test</title>\n</observation>")
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

    it("filters claude-mem messages by XML tags", async () => {
      const sessionFile = join(tempDir, "session.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"normal message"}}
{"type":"user","timestamp":"2026-01-12T01:30:01Z","message":{"content":"<observed_from_primary_session>...</observed_from_primary_session>"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:02Z","message":{"content":[{"type":"text","text":"<observation>...</observation>"}]}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"normal response"}]}}
`;
      await writeFile(sessionFile, content);

      const messages = await parseSessionFile(sessionFile);

      expect(messages.length).toBe(2);
      expect(messages[0].text).toBe("normal message");
      expect(messages[1].text).toBe("normal response");
    });

    it("filters out messages with empty text", async () => {
      const sessionFile = join(tempDir, "session.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"question"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"thinking","thinking":"internal thought"}]}}
{"type":"assistant","timestamp":"2026-01-12T01:30:06Z","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls"}}]}}
{"type":"user","timestamp":"2026-01-12T01:30:07Z","message":{"content":[{"type":"tool_result","content":"file.txt"}]}}
{"type":"assistant","timestamp":"2026-01-12T01:30:08Z","message":{"content":[{"type":"text","text":"answer"}]}}
`;
      await writeFile(sessionFile, content);

      const messages = await parseSessionFile(sessionFile);

      expect(messages.length).toBe(2);
      expect(messages[0].text).toBe("question");
      expect(messages[1].text).toBe("answer");
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

  describe("isClaudeMemObserverSession", () => {
    it("returns false for normal session", async () => {
      const sessionFile = join(tempDir, "normal-session.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T01:30:00Z","message":{"content":"質問内容"}}
{"type":"assistant","timestamp":"2026-01-12T01:30:05Z","message":{"content":[{"type":"text","text":"回答内容"}]}}
`;
      await writeFile(sessionFile, content);

      expect(await isClaudeMemObserverSession(sessionFile)).toBe(false);
    });

    it("returns true for claude-mem observer session", async () => {
      const sessionFile = join(tempDir, "claude-mem-session.jsonl");
      const content = `{"type":"queue-operation","operation":"dequeue","timestamp":"2026-01-12T07:55:10.519Z","sessionId":"test"}
{"type":"user","timestamp":"2026-01-12T07:55:10.536Z","message":{"content":"You are a Claude-Mem, a specialized observer tool for creating searchable memory FOR FUTURE SESSIONS.\\n\\nCRITICAL: Record what was LEARNED/BUILT/FIXED/DEPLOYED/CONFIGURED..."}}
{"type":"assistant","timestamp":"2026-01-12T07:55:15.055Z","message":{"content":[{"type":"text","text":"I'm ready to observe and record what happens in the primary session."}]}}
`;
      await writeFile(sessionFile, content);

      expect(await isClaudeMemObserverSession(sessionFile)).toBe(true);
    });

    it("returns true when claude-mem prompt is in first user message", async () => {
      const sessionFile = join(tempDir, "claude-mem-session2.jsonl");
      const content = `{"type":"user","timestamp":"2026-01-12T07:55:10.536Z","message":{"content":"You are a Claude-Mem, a specialized observer..."}}
{"type":"assistant","timestamp":"2026-01-12T07:55:15.055Z","message":{"content":[{"type":"text","text":"response"}]}}
`;
      await writeFile(sessionFile, content);

      expect(await isClaudeMemObserverSession(sessionFile)).toBe(true);
    });

    it("returns false for empty file", async () => {
      const sessionFile = join(tempDir, "empty-session.jsonl");
      await writeFile(sessionFile, "");

      expect(await isClaudeMemObserverSession(sessionFile)).toBe(false);
    });
  });
});
