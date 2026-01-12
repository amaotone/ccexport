import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import toml from "toml";

export interface Config {
  outputDir: string;
  filenameFormat: string;
  gitCommit: boolean;
  projectMode: "merge" | "separate";
  speakerUser: string;
  speakerAssistant: string;
}

interface RawConfig {
  output_dir?: string;
  filename_format?: string;
  git_commit?: boolean;
  project_mode?: string;
  speaker_user?: string;
  speaker_assistant?: string;
}

const DEFAULT_CONFIG: Omit<Config, "outputDir"> = {
  filenameFormat: "yyyy-MM-dd",
  gitCommit: false,
  projectMode: "merge",
  speakerUser: "👤",
  speakerAssistant: "🤖",
};

export function defaultConfigPath(): string {
  return join(homedir(), ".config", "ccexport", "config.toml");
}

export async function loadConfig(path: string): Promise<Config> {
  const content = await readFile(path, "utf-8");
  const raw = toml.parse(content) as RawConfig;

  return {
    outputDir: raw.output_dir ?? "",
    filenameFormat: raw.filename_format ?? DEFAULT_CONFIG.filenameFormat,
    gitCommit: raw.git_commit ?? DEFAULT_CONFIG.gitCommit,
    projectMode:
      (raw.project_mode as Config["projectMode"]) ?? DEFAULT_CONFIG.projectMode,
    speakerUser: raw.speaker_user ?? DEFAULT_CONFIG.speakerUser,
    speakerAssistant: raw.speaker_assistant ?? DEFAULT_CONFIG.speakerAssistant,
  };
}

export async function saveConfig(path: string, config: Config): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const content = `output_dir = "${config.outputDir}"
filename_format = "${config.filenameFormat}"
git_commit = ${config.gitCommit}
project_mode = "${config.projectMode}"
speaker_user = "${config.speakerUser}"
speaker_assistant = "${config.speakerAssistant}"
`;

  await writeFile(path, content);
}

export function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}
