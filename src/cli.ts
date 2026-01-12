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
  .description("Claude Code conversation history exporter")
  .version(VERSION)
  .option("-c, --config <path>", "Configuration file path")
  .option("-v, --verbose", "Output detailed logs");

// export command (default)
program
  .command("export", { isDefault: true })
  .description("Export conversation history")
  .option("-o, --output <dir>", "Output directory")
  .option("-d, --date <date>", "Target date (YYYY-MM-DD)")
  .option("-p, --project <path>", "Target project path")
  .option("--all", "Export all dates")
  .action(async (options) => {
    try {
      const configPath = program.opts().config || defaultConfigPath();
      const config = await loadConfig(configPath);

      const date = options.date ? new Date(options.date) : new Date();

      const markdown = await exportSessions(config, {
        date,
        outputDir: options.output,
        projectFilter: options.project,
      });

      if (markdown) {
        console.log(chalk.green("✅ Export completed"));
      } else {
        console.log(chalk.yellow("No sessions to export"));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// init command
program
  .command("init")
  .description("Create configuration file interactively")
  .option("--force", "Overwrite existing config file")
  .action(async (options) => {
    const configPath = program.opts().config || defaultConfigPath();

    try {
      if (!options.force) {
        await loadConfig(configPath);
        console.log(
          chalk.yellow(
            `Config file already exists: ${configPath}\nUse --force to overwrite`
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
      const outputDir = await question("Output directory: ");
      const filenameFormat =
        (await question("Filename format [yyyy-MM-dd]: ")) ||
        "yyyy-MM-dd";
      const projectModeStr = await question(
        "Project mode (merge/separate) [merge]: "
      );
      const projectMode =
        projectModeStr === "separate" ? "separate" : "merge";

      const config: Config = {
        outputDir,
        filenameFormat,
        projectMode,
        speakerUser: "👤",
        speakerAssistant: "🤖",
      };

      await saveConfig(configPath, config);

      console.log(chalk.green(`\n✅ Created config file: ${configPath}`));
      console.log("\nNext steps:");
      console.log("  ccexport hook install   # Configure Claude Code hook");
    } finally {
      rl.close();
    }
  });

// hook command
const hookCommand = program.command("hook").description("Manage Claude Code hooks");

hookCommand
  .command("install")
  .description("Install hook")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      await installHook(settingsPath);

      console.log(chalk.green("✅ Claude Code hook configured"));
      console.log(`\nThe following was added to ${settingsPath}:`);
      console.log(
        JSON.stringify(
          {
            hooks: {
              SessionEnd: [
                {
                  matcher: "",
                  hooks: [
                    {
                      type: "command",
                      command: "ccexport export",
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
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

hookCommand
  .command("uninstall")
  .description("Uninstall hook")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      await uninstallHook(settingsPath);
      console.log(chalk.green("✅ Hook removed"));
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

hookCommand
  .command("status")
  .description("Show hook status")
  .action(async () => {
    try {
      const settingsPath = defaultSettingsPath();
      const status = await getHookStatus(settingsPath);

      if (status.installed) {
        console.log(chalk.green("✅ Hook is installed"));
        console.log(`   Trigger: ${status.trigger}`);
        console.log(`   Command: ${status.command}`);
      } else {
        console.log(chalk.yellow("Hook is not installed"));
        console.log("  Run: ccexport hook install");
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// config command
const configCommand = program.command("config").description("View/edit configuration");

configCommand
  .command("show")
  .description("Show current configuration")
  .action(async () => {
    try {
      const configPath = program.opts().config || defaultConfigPath();
      const config = await loadConfig(configPath);

      console.log(`output_dir = "${config.outputDir}"`);
      console.log(`filename_format = "${config.filenameFormat}"`);
      console.log(`project_mode = "${config.projectMode}"`);
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

configCommand
  .command("path")
  .description("Show config file path")
  .action(() => {
    const configPath = program.opts().config || defaultConfigPath();
    console.log(configPath);
  });

configCommand
  .command("set <key> <value>")
  .description("Change configuration value")
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
        case "project_mode":
          if (value !== "merge" && value !== "separate") {
            console.error(chalk.red("project_mode must be 'merge' or 'separate'"));
            process.exit(1);
          }
          config.projectMode = value;
          break;
        default:
          console.error(chalk.red(`Unknown config key: ${key}`));
          process.exit(1);
      }

      await saveConfig(configPath, config);
      console.log(chalk.green(`✅ Updated ${key}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

configCommand
  .command("edit")
  .description("Open config file in editor")
  .action(async () => {
    const configPath = program.opts().config || defaultConfigPath();
    const editor = process.env.EDITOR || "vi";

    const { spawn } = await import("node:child_process");
    spawn(editor, [configPath], { stdio: "inherit" });
  });

program.parse();
