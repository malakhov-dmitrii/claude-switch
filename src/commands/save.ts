import type { KeychainIO } from "../lib/keychain";
import { profilesDir } from "../lib/paths";
import { validateName } from "../lib/validate";
import { die, info, warn } from "../lib/output";
import { writeFileSync, existsSync, mkdirSync, chmodSync } from "fs";
import { join } from "path";
import { cmdStatus } from "./status";

export function cmdSave(name: string, keychain: KeychainIO, profilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch save <name>");
  validateName(name);

  const dir = profilesDir(profilesDirOverride);
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, 0o700);

  const creds = keychain.getCreds();
  if (!creds) die("no credentials found in Keychain — are you logged in?");

  const file = join(dir, `${name}.json`);
  if (existsSync(file)) warn(`overwriting existing profile '${name}'`);

  writeFileSync(file, creds, { mode: 0o600 });
  info(`saved current credentials as '${name}'`);
  cmdStatus(keychain, profilesDirOverride);
}
