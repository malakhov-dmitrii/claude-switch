import { profilesDir } from "../lib/paths";
import { validateName } from "../lib/validate";
import { die, info } from "../lib/output";
import { existsSync, rmSync } from "fs";
import { join } from "path";

export function cmdDelete(name: string, profilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch delete <name>");
  validateName(name);

  const dir = profilesDir(profilesDirOverride);
  const file = join(dir, `${name}.json`);

  if (!existsSync(file)) die(`profile '${name}' not found`);

  rmSync(file);
  info(`deleted profile '${name}'`);
}
