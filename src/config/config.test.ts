import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import {
  Config,
  defaultConfigPath,
  loadConfig,
  saveConfig,
  expandPath,
} from "./config.js";

describe("config", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ccexport-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("defaultConfigPath", () => {
    it("returns path in home config directory", () => {
      const expected = join(homedir(), ".config", "ccexport", "config.toml");
      expect(defaultConfigPath()).toBe(expected);
    });
  });

  describe("loadConfig", () => {
    it("loads config from toml file", async () => {
      const configPath = join(tempDir, "config.toml");
      const content = `
output_dir = "~/obsidian/claude"
filename_format = "yyyy-MM-dd"
git_commit = true
project_mode = "separate"
`;
      await writeFile(configPath, content);

      const config = await loadConfig(configPath);

      expect(config.outputDir).toBe("~/obsidian/claude");
      expect(config.filenameFormat).toBe("yyyy-MM-dd");
      expect(config.gitCommit).toBe(true);
      expect(config.projectMode).toBe("separate");
    });

    it("uses default values for missing fields", async () => {
      const configPath = join(tempDir, "config.toml");
      const content = `output_dir = "/tmp/claude"`;
      await writeFile(configPath, content);

      const config = await loadConfig(configPath);

      expect(config.filenameFormat).toBe("yyyy-MM-dd");
      expect(config.gitCommit).toBe(false);
      expect(config.projectMode).toBe("merge");
    });

    it("throws error for nonexistent file", async () => {
      await expect(loadConfig("/nonexistent/config.toml")).rejects.toThrow();
    });
  });

  describe("saveConfig", () => {
    it("saves config to toml file", async () => {
      const configPath = join(tempDir, "subdir", "config.toml");
      const config: Config = {
        outputDir: "~/claude",
        filenameFormat: "yyyy-MM-dd",
        gitCommit: true,
        projectMode: "separate",
      };

      await saveConfig(configPath, config);

      const loaded = await loadConfig(configPath);
      expect(loaded.outputDir).toBe(config.outputDir);
      expect(loaded.gitCommit).toBe(config.gitCommit);
    });
  });

  describe("expandPath", () => {
    it("expands ~ to home directory", () => {
      const result = expandPath("~/documents");
      expect(result).toBe(join(homedir(), "documents"));
    });

    it("returns absolute path unchanged", () => {
      const result = expandPath("/absolute/path");
      expect(result).toBe("/absolute/path");
    });

    it("returns relative path unchanged", () => {
      const result = expandPath("relative/path");
      expect(result).toBe("relative/path");
    });
  });

  describe("Config.expandedOutputDir", () => {
    it("expands output_dir path", () => {
      const config: Config = {
        outputDir: "~/obsidian/claude",
        filenameFormat: "yyyy-MM-dd",
        gitCommit: false,
        projectMode: "merge",
      };

      const expected = join(homedir(), "obsidian/claude");
      expect(expandPath(config.outputDir)).toBe(expected);
    });
  });
});
