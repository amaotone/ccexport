import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatSession, formatMarkdown, Session } from "./export.js";
import { Message } from "../session/parser.js";

describe("export", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ccexport-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("formatSession", () => {
    it("formats session as markdown section", () => {
      const now = new Date();
      const session: Session = {
        id: "test-session",
        projectPath: "-Users-test-project",
        projectName: "project",
        messages: [
          {
            type: "user",
            timestamp: now,
            text: "TypeScriptでファイル監視する方法は？",
          },
          {
            type: "assistant",
            timestamp: new Date(now.getTime() + 5000),
            text: "Node.jsの`fs.watch`を使う方法があります。",
          },
        ],
        startTime: now,
      };

      const result = formatSession(session);

      // Check format pattern (HH:mm projectName)
      expect(result).toMatch(/^## \d{2}:\d{2} project/);
      expect(result).toContain("**User**: TypeScriptでファイル監視する方法は？");
      expect(result).toContain(
        "**Claude**: Node.jsの`fs.watch`を使う方法があります。"
      );
    });

    it("handles multiline messages", () => {
      const session: Session = {
        id: "test-session",
        projectPath: "-Users-test-project",
        projectName: "project",
        messages: [
          {
            type: "user",
            timestamp: new Date("2026-01-12T10:30:00Z"),
            text: "質問",
          },
          {
            type: "assistant",
            timestamp: new Date("2026-01-12T10:30:05Z"),
            text: "line1\nline2\nline3",
          },
        ],
        startTime: new Date("2026-01-12T10:30:00Z"),
      };

      const result = formatSession(session);

      expect(result).toContain("**Claude**: line1\nline2\nline3");
    });
  });

  describe("formatMarkdown", () => {
    it("formats multiple sessions with header", () => {
      const baseTime = new Date();
      const laterTime = new Date(baseTime.getTime() + 3600000); // 1 hour later

      const sessions: Session[] = [
        {
          id: "session1",
          projectPath: "-Users-test-projectA",
          projectName: "projectA",
          messages: [
            {
              type: "user",
              timestamp: baseTime,
              text: "質問1",
            },
            {
              type: "assistant",
              timestamp: new Date(baseTime.getTime() + 5000),
              text: "回答1",
            },
          ],
          startTime: baseTime,
        },
        {
          id: "session2",
          projectPath: "-Users-test-projectB",
          projectName: "projectB",
          messages: [
            {
              type: "user",
              timestamp: laterTime,
              text: "質問2",
            },
            {
              type: "assistant",
              timestamp: new Date(laterTime.getTime() + 5000),
              text: "回答2",
            },
          ],
          startTime: laterTime,
        },
      ];

      const result = formatMarkdown(sessions, baseTime);

      expect(result).toMatch(/^# \d{4}-\d{2}-\d{2} Claude会話ログ/);
      expect(result).toMatch(/## \d{2}:\d{2} projectA/);
      expect(result).toMatch(/## \d{2}:\d{2} projectB/);
      expect(result).toContain("---");
    });

    it("sorts sessions by start time", () => {
      const earlierTime = new Date();
      const laterTime = new Date(earlierTime.getTime() + 3600000); // 1 hour later

      const sessions: Session[] = [
        {
          id: "session2",
          projectPath: "-Users-test-projectB",
          projectName: "projectB",
          messages: [
            {
              type: "user",
              timestamp: laterTime,
              text: "later",
            },
          ],
          startTime: laterTime,
        },
        {
          id: "session1",
          projectPath: "-Users-test-projectA",
          projectName: "projectA",
          messages: [
            {
              type: "user",
              timestamp: earlierTime,
              text: "earlier",
            },
          ],
          startTime: earlierTime,
        },
      ];

      const result = formatMarkdown(sessions, earlierTime);

      const projectAIndex = result.indexOf("projectA");
      const projectBIndex = result.indexOf("projectB");
      expect(projectAIndex).toBeLessThan(projectBIndex);
    });

    it("returns empty string for no sessions", () => {
      const result = formatMarkdown([], new Date("2026-01-12"));
      expect(result).toBe("");
    });
  });
});
