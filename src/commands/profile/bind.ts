import { configProfilesDir, profilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die, info, dim } from "../../lib/output";
import { readManifest, writeManifest } from "../../lib/manifest";
import { existsSync } from "fs";
import { join } from "path";

export function cmdProfileBind(profile: string, account: string, configProfilesDirOverride?: string, profilesDirOverride?: string): void {
  if (!profile || !account) die("usage: claude-switch profile bind <profile> <account>");
  validateName(profile);
  validateName(account);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const profileDir = join(cpDir, profile);

  if (!existsSync(profileDir) || !existsSync(join(profileDir, "manifest.json"))) {
    die(`config profile '${profile}' not found`);
  }

  const pDir = profilesDir(profilesDirOverride);
  if (!existsSync(join(pDir, `${account}.json`))) {
    die(`account profile '${account}' not found`);
  }

  const manifest = readManifest(join(profileDir, "manifest.json"));
  manifest.boundAccount = account;
  writeManifest(profileDir, manifest);

  info(`bound '${profile}' to account '${account}'`);
  dim(`switching to '${profile}' will also switch credentials to '${account}'`);
}

export function cmdProfileUnbind(profile: string, configProfilesDirOverride?: string): void {
  if (!profile) die("usage: claude-switch profile unbind <profile>");
  validateName(profile);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const profileDir = join(cpDir, profile);

  if (!existsSync(profileDir) || !existsSync(join(profileDir, "manifest.json"))) {
    die(`config profile '${profile}' not found`);
  }

  const manifest = readManifest(join(profileDir, "manifest.json"));
  if (!manifest.boundAccount) {
    die(`config profile '${profile}' has no bound account`);
  }

  const oldAccount = manifest.boundAccount;
  manifest.boundAccount = "";
  writeManifest(profileDir, manifest);

  info(`unbound '${profile}' from account '${oldAccount}'`);
}
