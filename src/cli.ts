#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import {
  loadConfig,
  saveConfig,
  defaultConfigPath,
  expandPath,
  Config,
} from "./config/config.js";
import { exportSessions } from "./export/export.js";
import {
  installHook,
  uninstallHook,
  getHookStatus,
  defaultSettingsPath,
} from "./hook/hook.js";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("ccexport")
  .description("Claude Code会話履歴エクスポーター")
  .version(VERSION)
  .option("-c, --config <path>", "設定ファイルのパス")
  .option("-v, --verbose", "詳細ログを出力");

// export command (default)
program
  .command("export", { isDefault: true })
  .description("会話履歴をエクスポート")
  .option("-o, --output <dir>", "出力先ディレクトリ")
  .option("-d, --date <date>", "対象日付 (YYYY-MM-DD)")
  .option("-p, --project <path>", "対象プロジェクトのパス")
  .option("--all", "全日付をエクスポート")
  .option("--dry-run", "実行せずに出力内容を表示")
  .action(async (options) => {
    try {
      const configPath = program.opts().config || defaultConfigPath();
      const config = await loadConfig(configPath);

      const date = options.date ? new Date(options.date) : new Date();

      const markdown = await exportSessions(config, {
        date,
        outputDir: options.output,
        projectFilter: options.project,
        dryRun: options.dryRun,
      });

      if (options.dryRun) {
        console.log(markdown || "(エクスポートするセッションがありません)");
      } else if (markdown) {
        console.log(chalk.green("✅ エクスポートしました"));
      } else {
        console.log(chalk.yellow("エクスポートするセッションがありません"));
      }
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// init command
program
  .command("init")
  .description("設定ファイルを対話的に作成")
  .option("--force", "既存の設定ファイルを上書き")
  .action(async (options) => {
    const configPath = program.opts().config || defaultConfigPath();

    try {
      if (!options.force) {
        await loadConfig(configPath);
        console.log(
          chalk.yellow(
            `設定ファイルは既に存在します: ${configPath}\n--force で上書きできます`
          )
        );
        return;
      }
    } catch {
      // File doesn't exist, proceed with creation
    }

    const rl = createInterface({ input: stdin, output: stdout });

    const question = (prompt: string): Promise<string> =>
      new Promise((resolve) => {
        rl.question(prompt, resolve);
      });

    try {
      const outputDir = await question("出力先ディレクトリ: ");
      const filenameFormat =
        (await question("ファイル名フォーマット [yyyy-MM-dd]: ")) ||
        "yyyy-MM-dd";
      const gitCommitStr = await question("Git自動コミット (y/N): ");
      const gitCommit = gitCommitStr.toLowerCase() === "y";
      const projectModeStr = await question(
        "プロジェクトモード (merge/separate) [merge]: "
      );
      const projectMode =
        projectModeStr === "separate" ? "separate" : "merge";

      const config: Config = {
        outputDir,
        filenameFormat,
        gitCommit,
        projectMode,
      };

      await saveConfig(configPath, config);

      console.log(chalk.green(`\n✅ 設定ファイルを作成しました: ${configPath}`));
      console.log("\n次のステップ:");
      console.log("  ccexport hook install   # Claude Codeフックを設定");
    } finally {
      rl.close();
    }
  });

// hook command
const hookCommand = program.command("hook").description("Claude Codeフックを管理");

hookCommand
  .command("install")
  .description("フックをインストール")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      const ccexportPath = process.argv[1] || "ccexport";

      await installHook(settingsPath, ccexportPath);

      console.log(chalk.green("✅ Claude Codeフックを設定しました"));
      console.log(`\n${settingsPath} に以下が追加されました:`);
      console.log(
        JSON.stringify(
          {
            hooks: {
              PostToolUse: [
                {
                  matcher: "Stop",
                  hooks: [
                    {
                      type: "command",
                      command: `${ccexportPath} export`,
                    },
                  ],
                },
              ],
            },
          },
          null,
          2
        )
      );
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

hookCommand
  .command("uninstall")
  .description("フックをアンインストール")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      await uninstallHook(settingsPath);
      console.log(chalk.green("✅ フックを削除しました"));
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

hookCommand
  .command("status")
  .description("フックの状態を表示")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      const status = await getHookStatus(settingsPath);

      if (status.installed) {
        console.log(chalk.green("✅ フックはインストール済みです"));
        console.log(`   トリガー: ${status.trigger}`);
        console.log(`   コマンド: ${status.command}`);
      } else {
        console.log(chalk.yellow("フックはインストールされていません"));
        console.log("  ccexport hook install でインストールできます");
      }
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// config command
const configCommand = program.command("config").description("設定の表示・編集");

configCommand
  .command("show")
  .description("現在の設定を表示")
  .action(async () => {
    try {
      const configPath = program.opts().config || defaultConfigPath();
      const config = await loadConfig(configPath);

      console.log(`output_dir = "${config.outputDir}"`);
      console.log(`filename_format = "${config.filenameFormat}"`);
      console.log(`git_commit = ${config.gitCommit}`);
      console.log(`project_mode = "${config.projectMode}"`);
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

configCommand
  .command("path")
  .description("設定ファイルのパスを表示")
  .action(() => {
    const configPath = program.opts().config || defaultConfigPath();
    console.log(configPath);
  });

configCommand
  .command("set <key> <value>")
  .description("設定値を変更")
  .action(async (key: string, value: string) => {
    try {
      const configPath = program.opts().config || defaultConfigPath();
      const config = await loadConfig(configPath);

      switch (key) {
        case "output_dir":
          config.outputDir = value;
          break;
        case "filename_format":
          config.filenameFormat = value;
          break;
        case "git_commit":
          config.gitCommit = value === "true";
          break;
        case "project_mode":
          if (value !== "merge" && value !== "separate") {
            console.error(chalk.red("project_mode は merge または separate を指定してください"));
            process.exit(1);
          }
          config.projectMode = value;
          break;
        default:
          console.error(chalk.red(`不明な設定キー: ${key}`));
          process.exit(1);
      }

      await saveConfig(configPath, config);
      console.log(chalk.green(`✅ ${key} を更新しました`));
    } catch (error) {
      console.error(chalk.red(`エラー: ${(error as Error).message}`));
      process.exit(1);
    }
  });

configCommand
  .command("edit")
  .description("エディタで設定ファイルを開く")
  .action(async () => {
    const configPath = program.opts().config || defaultConfigPath();
    const editor = process.env.EDITOR || "vi";

    const { spawn } = await import("node:child_process");
    spawn(editor, [configPath], { stdio: "inherit" });
  });

program.parse();
