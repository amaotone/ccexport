import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, mkdir, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatSession, formatMarkdown, Session, exportSessionsWithSessions, parseLocalDate } from "./export.js";
import { Message } from "../session/parser.js";
import { Config } from "../config/config.js";

describe("export", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ccexport-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("formatSession", () => {
    const defaultConfig: Config = {
      outputDir: "/tmp",
      filenameFormat: "yyyy-MM-dd",
            projectMode: "merge",
      speakerUser: "User:",
      speakerAssistant: "Claude:",
    };

    it("formats session as markdown section with emoji speakers", () => {
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

      const result = formatSession(session, defaultConfig);

      // Check format pattern (HH:mm projectName)
      expect(result).toMatch(/^## \d{2}:\d{2} project/);
      expect(result).toContain("User: TypeScriptでファイル監視する方法は？");
      expect(result).toContain(
        "Claude: Node.jsの`fs.watch`を使う方法があります。"
      );
    });

    it("uses custom speaker labels from config", () => {
      const now = new Date();
      const session: Session = {
        id: "test-session",
        projectPath: "-Users-test-project",
        projectName: "project",
        messages: [
          {
            type: "user",
            timestamp: now,
            text: "質問",
          },
          {
            type: "assistant",
            timestamp: new Date(now.getTime() + 5000),
            text: "回答",
          },
        ],
        startTime: now,
      };

      const config: Config = {
        ...defaultConfig,
        speakerUser: "User:",
        speakerAssistant: "Claude:",
      };

      const result = formatSession(session, config);

      expect(result).toContain("User: 質問");
      expect(result).toContain("Claude: 回答");
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

      const result = formatSession(session, defaultConfig);

      expect(result).toContain("Claude: line1\nline2\nline3");
    });
  });

  describe("formatMarkdown", () => {
    const defaultConfig: Config = {
      outputDir: "/tmp",
      filenameFormat: "yyyy-MM-dd",
            projectMode: "merge",
      speakerUser: "User:",
      speakerAssistant: "Claude:",
    };

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

      const result = formatMarkdown(sessions, baseTime, defaultConfig);

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

      const result = formatMarkdown(sessions, earlierTime, defaultConfig);

      const projectAIndex = result.indexOf("projectA");
      const projectBIndex = result.indexOf("projectB");
      expect(projectAIndex).toBeLessThan(projectBIndex);
    });

    it("returns empty string for no sessions", () => {
      const result = formatMarkdown([], new Date("2026-01-12"), defaultConfig);
      expect(result).toBe("");
    });
  });

  describe("exportSessionsWithSessions", () => {
    it("exports to single file in merge mode", async () => {
      const date = new Date("2026-01-12T10:00:00Z");
      const sessions: Session[] = [
        {
          id: "session1",
          projectPath: "-Users-test-projectA",
          projectName: "projectA",
          messages: [
            { type: "user", timestamp: date, text: "質問A" },
          ],
          startTime: date,
        },
        {
          id: "session2",
          projectPath: "-Users-test-projectB",
          projectName: "projectB",
          messages: [
            { type: "user", timestamp: date, text: "質問B" },
          ],
          startTime: date,
        },
      ];

      const config: Config = {
        outputDir: tempDir,
        filenameFormat: "yyyy-MM-dd",
        projectMode: "merge",
        speakerUser: "User:",
        speakerAssistant: "Claude:",
      };

      await exportSessionsWithSessions(config, { date }, sessions);

      const files = await readdir(tempDir);
      expect(files).toEqual(["2026-01-12.md"]);

      const content = await readFile(join(tempDir, "2026-01-12.md"), "utf-8");
      expect(content).toContain("projectA");
      expect(content).toContain("projectB");
    });

    it("exports to separate directories in separate mode", async () => {
      const date = new Date("2026-01-12T10:00:00Z");
      const sessions: Session[] = [
        {
          id: "session1",
          projectPath: "-Users-test-projectA",
          projectName: "projectA",
          messages: [
            { type: "user", timestamp: date, text: "質問A" },
          ],
          startTime: date,
        },
        {
          id: "session2",
          projectPath: "-Users-test-projectB",
          projectName: "projectB",
          messages: [
            { type: "user", timestamp: date, text: "質問B" },
          ],
          startTime: date,
        },
      ];

      const config: Config = {
        outputDir: tempDir,
        filenameFormat: "yyyy-MM-dd",
        projectMode: "separate",
        speakerUser: "User:",
        speakerAssistant: "Claude:",
      };

      await exportSessionsWithSessions(config, { date }, sessions);

      const dirs = await readdir(tempDir);
      expect(dirs.sort()).toEqual(["projectA", "projectB"]);

      const contentA = await readFile(join(tempDir, "projectA", "2026-01-12.md"), "utf-8");
      expect(contentA).toContain("projectA");
      expect(contentA).not.toContain("projectB");

      const contentB = await readFile(join(tempDir, "projectB", "2026-01-12.md"), "utf-8");
      expect(contentB).toContain("projectB");
      expect(contentB).not.toContain("projectA");
    });
  });

  describe("parseLocalDate", () => {
    it("parses date string as local midnight", () => {
      const date = parseLocalDate("2026-01-12");

      // Should be local midnight, not UTC
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(12);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it("differs from UTC parsing for date-only strings", () => {
      const localDate = parseLocalDate("2026-01-12");
      const utcDate = new Date("2026-01-12");

      // Local date should be at local midnight
      expect(localDate.getHours()).toBe(0);

      // UTC date parsed from date-only string is UTC midnight,
      // which may be a different hour in local time
      // (In JST it would be 9:00, in PST it would be 16:00 on Jan 11)
      // We just verify they're potentially different
      expect(localDate.getTime()).not.toBe(utcDate.getTime());
    });

    it("handles various date formats", () => {
      const date1 = parseLocalDate("2025-12-31");
      expect(date1.getFullYear()).toBe(2025);
      expect(date1.getMonth()).toBe(11); // December
      expect(date1.getDate()).toBe(31);

      const date2 = parseLocalDate("2026-06-15");
      expect(date2.getFullYear()).toBe(2026);
      expect(date2.getMonth()).toBe(5); // June
      expect(date2.getDate()).toBe(15);
    });
  });
});
