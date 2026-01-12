import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  installHook,
  uninstallHook,
  getHookStatus,
  HookStatus,
} from "./hook.js";

describe("hook", () => {
  let tempDir: string;
  let settingsPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ccexport-test-"));
    settingsPath = join(tempDir, ".claude", "settings.json");
    await mkdir(join(tempDir, ".claude"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("installHook", () => {
    it("creates settings file if not exists", async () => {
      await installHook(settingsPath, "/usr/local/bin/ccexport");

      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      expect(settings.hooks.SessionEnd).toBeDefined();
      expect(settings.hooks.SessionEnd[0].matcher).toBe("");
      expect(settings.hooks.SessionEnd[0].hooks[0].command).toBe(
        "/usr/local/bin/ccexport export"
      );
    });

    it("adds hook to existing settings", async () => {
      await writeFile(
        settingsPath,
        JSON.stringify({
          existingSetting: true,
        })
      );

      await installHook(settingsPath, "/usr/local/bin/ccexport");

      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      expect(settings.existingSetting).toBe(true);
      expect(settings.hooks.SessionEnd).toBeDefined();
    });

    it("preserves existing hooks", async () => {
      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            PreToolUse: [{ matcher: "Test", hooks: [] }],
          },
        })
      );

      await installHook(settingsPath, "/usr/local/bin/ccexport");

      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      expect(settings.hooks.PreToolUse).toBeDefined();
      expect(settings.hooks.SessionEnd).toBeDefined();
    });
  });

  describe("uninstallHook", () => {
    it("removes ccexport hook", async () => {
      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            SessionEnd: [
              {
                matcher: "",
                hooks: [
                  { type: "command", command: "/usr/local/bin/ccexport export" },
                ],
              },
            ],
          },
        })
      );

      await uninstallHook(settingsPath);

      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      expect(settings.hooks.SessionEnd).toHaveLength(0);
    });

    it("preserves other hooks", async () => {
      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            SessionEnd: [
              {
                matcher: "",
                hooks: [
                  { type: "command", command: "/usr/local/bin/ccexport export" },
                ],
              },
              {
                matcher: "",
                hooks: [{ type: "command", command: "other-command" }],
              },
            ],
          },
        })
      );

      await uninstallHook(settingsPath);

      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      expect(settings.hooks.SessionEnd).toHaveLength(1);
      expect(settings.hooks.SessionEnd[0].hooks[0].command).toBe("other-command");
    });

    it("does nothing if no settings file", async () => {
      // Should not throw
      await expect(uninstallHook(settingsPath)).resolves.toBeUndefined();
    });
  });

  describe("getHookStatus", () => {
    it("returns not_installed when settings file missing", async () => {
      const status = await getHookStatus(settingsPath);
      expect(status.installed).toBe(false);
    });

    it("returns not_installed when no hooks", async () => {
      await writeFile(settingsPath, JSON.stringify({}));

      const status = await getHookStatus(settingsPath);
      expect(status.installed).toBe(false);
    });

    it("returns installed with details when hook exists", async () => {
      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            SessionEnd: [
              {
                matcher: "",
                hooks: [
                  { type: "command", command: "/usr/local/bin/ccexport export" },
                ],
              },
            ],
          },
        })
      );

      const status = await getHookStatus(settingsPath);

      expect(status.installed).toBe(true);
      expect(status.trigger).toBe("SessionEnd");
      expect(status.command).toBe("/usr/local/bin/ccexport export");
    });
  });
});
