#!/usr/bin/env bun

import { die } from "./lib/output";
import { createKeychainIO } from "./lib/keychain";
import { BOLD, DIM, CYAN, RESET } from "./lib/output";
import { cmdStatus } from "./commands/status";
import { cmdSave } from "./commands/save";
import { cmdUse } from "./commands/use";
import { cmdList } from "./commands/list";
import { cmdDelete } from "./commands/delete";
import { cmdProfileSave } from "./commands/profile/save";
import { cmdProfileUse } from "./commands/profile/use";
import { cmdProfileList } from "./commands/profile/list";
import { cmdProfileDelete } from "./commands/profile/delete";
import { cmdProfileShow } from "./commands/profile/show";
import { cmdProfileClone } from "./commands/profile/clone";
import { cmdProfileBind, cmdProfileUnbind } from "./commands/profile/bind";

const VERSION = "2.0.0";
const args = process.argv.slice(2);
const cmd = args[0] ?? "status";

const keychain = createKeychainIO();

function printUsage(): void {
  process.stdout.write(`${BOLD}claude-switch${RESET} ${DIM}v${VERSION}${RESET} — switch between Claude Code accounts

${BOLD}USAGE${RESET}
    claude-switch <command> [args]

${BOLD}COMMANDS${RESET}
    ${CYAN}status${RESET}            Show active account and matched profile
    ${CYAN}save${RESET} <name>       Save current credentials as a named profile
    ${CYAN}use${RESET} <name>        Switch to a saved profile
    ${CYAN}list${RESET}              List all saved profiles
    ${CYAN}delete${RESET} <name>     Delete a saved profile
    ${CYAN}profile${RESET} <cmd>     Manage configuration profiles (hooks, settings, plugins...)

${BOLD}OPTIONS${RESET}
    -h, --help        Show this help
    -v, --version     Show version

${BOLD}QUICK START${RESET}
    ${DIM}# Save your first account${RESET}
    claude-switch save personal

    ${DIM}# Log in to second account, then save it${RESET}
    claude auth logout && claude auth login
    claude-switch save work

    ${DIM}# Switch anytime${RESET}
    claude-switch use work
    claude-switch use personal

${BOLD}PROFILE MANAGEMENT${RESET}
    ${DIM}# Save your full Claude Code setup as a named profile${RESET}
    claude-switch profile save work-setup

    ${DIM}# Switch to a different configuration${RESET}
    claude-switch profile use minimal-setup

    ${DIM}# Clone a profile, picking only some components${RESET}
    claude-switch profile clone work-setup experiment --only hooks,settings

    ${DIM}# See all profile commands${RESET}
    claude-switch profile --help
`);
}

function printProfileUsage(): void {
  process.stdout.write(`${BOLD}claude-switch profile${RESET} — manage configuration profiles

${BOLD}USAGE${RESET}
    claude-switch profile <command> [args]

${BOLD}COMMANDS${RESET}
    ${CYAN}save${RESET} <name>                          Save current config as a named profile
    ${CYAN}use${RESET} <name>                           Switch to a saved config profile
    ${CYAN}list${RESET}                                 List all config profiles
    ${CYAN}delete${RESET} <name>                        Delete a config profile
    ${CYAN}clone${RESET} <source> <target>              Clone with interactive component picker
    ${CYAN}clone${RESET} <source> <target> --all        Clone all components
    ${CYAN}clone${RESET} <source> <target> --only X,Y   Clone specific components only
    ${CYAN}show${RESET} <name>                          Show profile details
    ${CYAN}bind${RESET} <profile> <account>             Bind profile to an account
    ${CYAN}unbind${RESET} <profile>                     Remove account binding

${BOLD}COMPONENTS${RESET}
    settings   settings.json, settings.local.json
    hooks      hooks/ directory
    plugins    plugins/ directory (excluding cache)
    commands   commands/ directory
    skills     skills/ directory
    md_files   *.md files at ~/.claude/ root
    mcp        mcp.json

${BOLD}EXAMPLES${RESET}
    ${DIM}# Save everything, switch anytime${RESET}
    claude-switch profile save work-setup
    claude-switch profile use work-setup

    ${DIM}# Clone just hooks and settings for experimenting${RESET}
    claude-switch profile clone work-setup experiment --only hooks,settings

    ${DIM}# Bind a config profile to auto-switch credentials too${RESET}
    claude-switch profile bind work-setup work
`);
}

async function handleProfile(profileArgs: string[]): Promise<void> {
  const subcmd = profileArgs[0] ?? "";
  const rest = profileArgs.slice(1);

  switch (subcmd) {
    case "save": cmdProfileSave(rest[0]); break;
    case "use": case "switch": cmdProfileUse(rest[0], keychain); break;
    case "list": case "ls": cmdProfileList(); break;
    case "delete": case "rm": case "remove": cmdProfileDelete(rest[0]); break;
    case "clone": await cmdProfileClone(rest); break;
    case "show": case "info": cmdProfileShow(rest[0]); break;
    case "bind": cmdProfileBind(rest[0], rest[1]); break;
    case "unbind": cmdProfileUnbind(rest[0]); break;
    case "-h": case "--help": case "help": case "": printProfileUsage(); break;
    default:
      die(`unknown profile command '${subcmd}' — run 'claude-switch profile --help'`);
  }
}

switch (cmd) {
  case "status": cmdStatus(keychain); break;
  case "save": cmdSave(args[1], keychain); break;
  case "use": case "switch": cmdUse(args[1], keychain); break;
  case "list": case "ls": cmdList(keychain); break;
  case "delete": case "rm": case "remove": cmdDelete(args[1]); break;
  case "profile": case "config": await handleProfile(args.slice(1)); break;
  case "-v": case "--version": console.log(`claude-switch ${VERSION}`); break;
  case "-h": case "--help": case "help": printUsage(); break;
  default:
    die(`unknown command '${cmd}' — run 'claude-switch --help' for usage`);
}
