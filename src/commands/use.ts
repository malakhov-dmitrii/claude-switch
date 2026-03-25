import type { KeychainIO } from "../lib/keychain";
import { profilesDir } from "../lib/paths";
import { validateName } from "../lib/validate";
import { die, info, dim } from "../lib/output";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, extname } from "path";
import { cmdStatus } from "./status";

export function cmdUse(name: string, keychain: KeychainIO, profilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch use <name>");
  validateName(name);

  const dir = profilesDir(profilesDirOverride);
  const file = join(dir, `${name}.json`);

  if (!existsSync(file)) {
    const available = existsSync(dir)
      ? readdirSync(dir).filter(f => extname(f) === ".json").map(f => f.replace(/\.json$/, "")).join(" ")
      : "none";
    die(`profile '${name}' not found (available: ${available})`);
  }

  const creds = readFileSync(file, "utf-8");
  keychain.setCreds(creds);

  info(`switched to '${name}'`);
  dim("restart Claude Code to use the new credentials");
  process.stdout.write("\n");
  cmdStatus(keychain, profilesDirOverride);
}
