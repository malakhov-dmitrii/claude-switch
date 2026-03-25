import { configProfilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die, info } from "../../lib/output";
import { existsSync, rmSync } from "fs";
import { join } from "path";

export function cmdProfileDelete(name: string, configProfilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch profile delete <name>");
  validateName(name);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const profileDir = join(cpDir, name);

  if (!existsSync(profileDir) || !existsSync(join(profileDir, "manifest.json"))) {
    die(`config profile '${name}' not found`);
  }

  rmSync(profileDir, { recursive: true, force: true });
  info(`deleted config profile '${name}'`);
}
