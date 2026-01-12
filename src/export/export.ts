import { readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { format } from "date-fns";
import {
  Message,
  parseSessionFile,
  getClaudeProjectsDir,
  isSubagentSession,
  isClaudeMemObserverSession,
} from "../session/parser.js";
import { Config, expandPath } from "../config/config.js";

export interface Session {
  id: string;
  projectPath: string;
  projectName: string;
  messages: Message[];
  startTime: Date;
}

function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatSession(session: Session): string {
  const lines: string[] = [];

  lines.push(`## ${formatTime(session.startTime)} ${session.projectName}`);
  lines.push("");

  for (const msg of session.messages) {
    const speaker = msg.type === "user" ? "User" : "Claude";
    lines.push(`**${speaker}**: ${msg.text}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function formatMarkdown(sessions: Session[], date: Date): string {
  if (sessions.length === 0) {
    return "";
  }

  // Sort by start time
  const sorted = [...sessions].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const lines: string[] = [];
  lines.push(`# ${formatDate(date)} Claude会話ログ`);
  lines.push("");

  for (let i = 0; i < sorted.length; i++) {
    lines.push(formatSession(sorted[i]));

    if (i < sorted.length - 1) {
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function projectHashToName(hash: string): string {
  const parts = hash.split("-");
  return parts[parts.length - 1] || hash;
}

function sameDate(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

async function findSessionsInProject(
  projectDir: string,
  projectHash: string,
  date: Date
): Promise<Session[]> {
  const sessions: Session[] = [];

  let entries;
  try {
    entries = await readdir(projectDir);
  } catch {
    return sessions;
  }

  for (const entry of entries) {
    if (!entry.endsWith(".jsonl")) {
      continue;
    }

    const sessionPath = join(projectDir, entry);

    if (isSubagentSession(sessionPath)) {
      continue;
    }

    if (await isClaudeMemObserverSession(sessionPath)) {
      continue;
    }

    let fileStat;
    try {
      fileStat = await stat(sessionPath);
    } catch {
      continue;
    }

    if (!sameDate(fileStat.mtime, date)) {
      continue;
    }

    let messages;
    try {
      messages = await parseSessionFile(sessionPath);
    } catch {
      continue;
    }

    if (messages.length === 0) {
      continue;
    }

    sessions.push({
      id: basename(entry, ".jsonl"),
      projectPath: projectHash,
      projectName: projectHashToName(projectHash),
      messages,
      startTime: messages[0].timestamp,
    });
  }

  return sessions;
}

export async function findSessions(
  projectsDir: string,
  date: Date
): Promise<Session[]> {
  const sessions: Session[] = [];

  let entries;
  try {
    entries = await readdir(projectsDir);
  } catch {
    return sessions;
  }

  for (const entry of entries) {
    const projectDir = join(projectsDir, entry);

    let projectStat;
    try {
      projectStat = await stat(projectDir);
    } catch {
      continue;
    }

    if (!projectStat.isDirectory()) {
      continue;
    }

    const projectSessions = await findSessionsInProject(projectDir, entry, date);
    sessions.push(...projectSessions);
  }

  return sessions;
}

export interface ExportOptions {
  date: Date;
  outputDir?: string;
  projectFilter?: string;
  dryRun?: boolean;
}

export async function exportSessionsWithSessions(
  config: Config,
  options: ExportOptions,
  sessions: Session[]
): Promise<string> {
  if (sessions.length === 0) {
    return "";
  }

  const outputDir = expandPath(options.outputDir ?? config.outputDir);
  const filename = `${format(options.date, config.filenameFormat)}.md`;

  if (config.projectMode === "separate") {
    // Group sessions by project
    const sessionsByProject = new Map<string, Session[]>();
    for (const session of sessions) {
      const existing = sessionsByProject.get(session.projectName) ?? [];
      existing.push(session);
      sessionsByProject.set(session.projectName, existing);
    }

    // Export each project to its own directory
    const allMarkdown: string[] = [];
    for (const [projectName, projectSessions] of sessionsByProject) {
      const projectDir = join(outputDir, projectName);
      await mkdir(projectDir, { recursive: true });

      const markdown = formatMarkdown(projectSessions, options.date);
      if (markdown && !options.dryRun) {
        await writeFile(join(projectDir, filename), markdown);
      }
      allMarkdown.push(markdown);
    }
    return allMarkdown.join("\n\n");
  }

  // merge mode (default)
  const markdown = formatMarkdown(sessions, options.date);

  if (options.dryRun || !markdown) {
    return markdown;
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, filename), markdown);

  return markdown;
}

export async function exportSessions(
  config: Config,
  options: ExportOptions
): Promise<string> {
  const projectsDir = getClaudeProjectsDir();
  let sessions = await findSessions(projectsDir, options.date);

  if (options.projectFilter) {
    const filterHash = options.projectFilter.replace(/\//g, "-");
    sessions = sessions.filter((s) => s.projectPath.includes(filterHash));
  }

  return exportSessionsWithSessions(config, options, sessions);
}
