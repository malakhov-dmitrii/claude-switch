import { claudeDir, configProfilesDir, profilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die, info, warn, dim } from "../../lib/output";
import { readManifest } from "../../lib/manifest";
import { restoreComponentFromProfile } from "../../lib/components";
import { autoSnapshot } from "../../lib/snapshot";
import { existsSync, readFileSync, readdirSync, mkdirSync, chmodSync } from "fs";
import { join } from "path";
import type { KeychainIO } from "../../lib/keychain";
import type { ComponentName } from "../../lib/components";

export function cmdProfileUse(
  name: string,
  keychain: KeychainIO,
  claudeDirOverride?: string,
  configProfilesDirOverride?: string,
  profilesDirOverride?: string,
): void {
  if (!name) die("usage: claude-switch profile use <name>");
  validateName(name);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const profileDir = join(cpDir, name);

  if (!existsSync(profileDir) || !existsSync(join(profileDir, "manifest.json"))) {
    const available = existsSync(cpDir)
      ? readdirSync(cpDir).filter(d => existsSync(join(cpDir, d, "manifest.json"))).join(" ")
      : "none";
    die(`config profile '${name}' not found (available: ${available || "none"})`);
  }

  const manifest = readManifest(join(profileDir, "manifest.json"));

  if (manifest.components.length === 0) {
    die(`profile '${name}' has no components listed in manifest`);
  }

  const cDir = claudeDir(claudeDirOverride);
  mkdirSync(cpDir, { recursive: true });
  chmodSync(cpDir, 0o700);

  // Auto-snapshot before restore
  autoSnapshot(cDir, cpDir);

  // Restore each component
  for (const comp of manifest.components) {
    restoreComponentFromProfile(comp as ComponentName, profileDir, cDir);
  }

  // Switch account if bound
  if (manifest.boundAccount) {
    const pDir = profilesDir(profilesDirOverride);
    const accountFile = join(pDir, `${manifest.boundAccount}.json`);
    if (existsSync(accountFile)) {
      const creds = readFileSync(accountFile, "utf-8");
      keychain.setCreds(creds);
      dim(`switched credentials to bound account '${manifest.boundAccount}'`);
    } else {
      warn(`bound account '${manifest.boundAccount}' not found — credentials not switched`);
    }
  }

  info(`switched to config profile '${name}'`);
  dim(`restored: ${manifest.components.join(",")}`);
  dim("restart Claude Code to pick up the new configuration");
}
