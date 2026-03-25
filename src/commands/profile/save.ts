import { claudeDir, configProfilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die, info, warn, dim } from "../../lib/output";
import { writeManifest } from "../../lib/manifest";
import { ALL_COMPONENTS, componentExistsInSource, copyComponentToProfile } from "../../lib/components";
import { mkdirSync, existsSync, rmSync, chmodSync } from "fs";
import type { ComponentName } from "../../lib/components";

export function cmdProfileSave(name: string, claudeDirOverride?: string, configProfilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch profile save <name>");
  validateName(name);

  if (name.startsWith("_auto_")) die("profile names starting with '_auto_' are reserved for auto-snapshots");

  const cDir = claudeDir(claudeDirOverride);
  const cpDir = configProfilesDir(configProfilesDirOverride);
  mkdirSync(cpDir, { recursive: true });
  chmodSync(cpDir, 0o700);

  const profileDir = `${cpDir}/${name}`;

  if (existsSync(profileDir)) {
    warn(`overwriting existing profile '${name}'`);
    rmSync(profileDir, { recursive: true, force: true });
  }

  mkdirSync(profileDir, { recursive: true, mode: 0o700 });

  const savedComponents: ComponentName[] = [];
  for (const comp of ALL_COMPONENTS) {
    if (componentExistsInSource(comp, cDir)) {
      copyComponentToProfile(comp, cDir, profileDir);
      savedComponents.push(comp);
    }
  }

  if (savedComponents.length === 0) {
    rmSync(profileDir, { recursive: true, force: true });
    die(`no configuration found in ${cDir} to save`);
  }

  writeManifest(profileDir, {
    name,
    created: new Date().toISOString(),
    components: savedComponents,
    boundAccount: "",
  });

  info(`saved config profile '${name}'`);
  dim(`components: ${savedComponents.join(",")}`);
}
