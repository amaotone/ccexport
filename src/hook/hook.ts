import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

interface HookEntry {
  type: string;
  command: string;
}

interface HookMatcher {
  matcher: string;
  hooks: HookEntry[];
}

interface ClaudeSettings {
  hooks?: {
    SessionEnd?: HookMatcher[];
    PostToolUse?: HookMatcher[];
    PreToolUse?: HookMatcher[];
    [key: string]: HookMatcher[] | undefined;
  };
  [key: string]: unknown;
}

export interface HookStatus {
  installed: boolean;
  trigger?: string;
  command?: string;
}

export function defaultSettingsPath(): string {
  return join(homedir(), ".claude", "settings.json");
}

async function loadSettings(path: string): Promise<ClaudeSettings> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return {};
  }
}

async function saveSettings(path: string, settings: ClaudeSettings): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(settings, null, 2));
}

function isCcexportHook(matcher: HookMatcher): boolean {
  return matcher.hooks.some((h) => h.command.includes("ccexport"));
}

export async function installHook(settingsPath: string): Promise<void> {
  const settings = await loadSettings(settingsPath);

  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.SessionEnd) {
    settings.hooks.SessionEnd = [];
  }

  // Remove existing ccexport hook if present (from SessionEnd or old PostToolUse)
  settings.hooks.SessionEnd = settings.hooks.SessionEnd.filter(
    (m) => !isCcexportHook(m)
  );
  if (settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
      (m) => !isCcexportHook(m)
    );
  }

  // Add new hook
  settings.hooks.SessionEnd.push({
    matcher: "",
    hooks: [
      {
        type: "command",
        command: "ccexport export",
      },
    ],
  });

  await saveSettings(settingsPath, settings);
}

export async function uninstallHook(settingsPath: string): Promise<void> {
  let settings;
  try {
    settings = await loadSettings(settingsPath);
  } catch {
    return; // No settings file, nothing to do
  }

  if (!settings.hooks) {
    return;
  }

  // Remove from SessionEnd
  if (settings.hooks.SessionEnd) {
    settings.hooks.SessionEnd = settings.hooks.SessionEnd.filter(
      (m) => !isCcexportHook(m)
    );
  }

  // Also remove from old PostToolUse location
  if (settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
      (m) => !isCcexportHook(m)
    );
  }

  await saveSettings(settingsPath, settings);
}

export async function getHookStatus(settingsPath: string): Promise<HookStatus> {
  let settings;
  try {
    settings = await loadSettings(settingsPath);
  } catch {
    return { installed: false };
  }

  if (!settings.hooks?.SessionEnd) {
    return { installed: false };
  }

  const ccexportHook = settings.hooks.SessionEnd.find((m) => isCcexportHook(m));

  if (!ccexportHook) {
    return { installed: false };
  }

  const commandHook = ccexportHook.hooks.find((h) =>
    h.command.includes("ccexport")
  );

  return {
    installed: true,
    trigger: "SessionEnd",
    command: commandHook?.command,
  };
}
