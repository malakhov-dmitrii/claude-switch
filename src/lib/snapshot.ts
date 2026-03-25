import { mkdirSync, readdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { writeManifest } from "./manifest";
import { ALL_COMPONENTS, copyComponentToProfile, componentExistsInSource } from "./components";
import { dim } from "./output";
import type { ComponentName } from "./components";

export const MAX_AUTO_SNAPSHOTS = 5;

export function autoSnapshot(claudeDir: string, configProfilesDir: string): string | null {
  const foundComponents: ComponentName[] = [];
  for (const comp of ALL_COMPONENTS) {
    if (componentExistsInSource(comp, claudeDir)) {
      foundComponents.push(comp);
    }
  }

  if (foundComponents.length === 0) return null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const snapName = `_auto_${ts}`;
  const snapDir = join(configProfilesDir, snapName);

  mkdirSync(snapDir, { recursive: true, mode: 0o700 });

  for (const comp of foundComponents) {
    copyComponentToProfile(comp, claudeDir, snapDir);
  }

  writeManifest(snapDir, {
    name: snapName,
    created: now.toISOString(),
    components: foundComponents,
    boundAccount: "",
  });

  pruneAutoSnapshots(configProfilesDir);
  dim(`auto-saved current config as '${snapName}'`);
  return snapName;
}

export function pruneAutoSnapshots(configProfilesDir: string, max: number = MAX_AUTO_SNAPSHOTS): void {
  if (!existsSync(configProfilesDir)) return;

  const autoSnapshots = readdirSync(configProfilesDir)
    .filter(d => d.startsWith("_auto_") && existsSync(join(configProfilesDir, d, "manifest.json")))
    .sort();

  if (autoSnapshots.length <= max) return;

  const toRemove = autoSnapshots.slice(0, autoSnapshots.length - max);
  for (const name of toRemove) {
    rmSync(join(configProfilesDir, name), { recursive: true, force: true });
  }
}
