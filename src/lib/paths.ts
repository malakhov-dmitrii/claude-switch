import { homedir, userInfo } from "os";
import { join } from "path";

export const KEYCHAIN_SERVICE = "Claude Code-credentials";

export function keychainAccount(): string {
  return process.env.CLAUDE_SWITCH_KEYCHAIN_ACCOUNT || userInfo().username;
}

export function claudeDir(override?: string): string {
  return override ?? process.env.CLAUDE_DIR ?? join(homedir(), ".claude");
}

export function profilesDir(override?: string): string {
  return override ?? process.env.CLAUDE_SWITCH_DIR ?? join(claudeDir(), "profiles");
}

export function configProfilesDir(override?: string): string {
  return override ?? process.env.CLAUDE_SWITCH_CONFIG_DIR ?? join(claudeDir(), "config-profiles");
}
