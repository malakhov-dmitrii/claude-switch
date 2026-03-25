import { configProfilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die } from "../../lib/output";
import { BOLD, DIM, GREEN, RESET } from "../../lib/output";
import { readManifest } from "../../lib/manifest";
import { COMPONENT_DISPLAY } from "../../lib/components";
import { existsSync } from "fs";
import { join } from "path";
import type { ComponentName } from "../../lib/components";

function dirSize(path: string): string {
  try {
    const result = Bun.spawnSync(["du", "-sh", path]);
    return result.stdout.toString().split("\t")[0]?.trim() ?? "";
  } catch {
    return "";
  }
}

export function cmdProfileShow(name: string, configProfilesDirOverride?: string): void {
  if (!name) die("usage: claude-switch profile show <name>");
  validateName(name);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const profileDir = join(cpDir, name);

  if (!existsSync(profileDir) || !existsSync(join(profileDir, "manifest.json"))) {
    die(`config profile '${name}' not found`);
  }

  const manifest = readManifest(join(profileDir, "manifest.json"));

  process.stdout.write(`${BOLD}${name}${RESET}\n`);
  process.stdout.write(`  ${DIM}created:${RESET}  ${manifest.created || "unknown"}\n`);

  if (manifest.boundAccount) {
    process.stdout.write(`  ${DIM}account:${RESET}  ${manifest.boundAccount}\n`);
  }

  process.stdout.write(`  ${DIM}components:${RESET}\n`);

  for (const comp of manifest.components) {
    const display = COMPONENT_DISPLAY[comp as ComponentName] || comp;
    let sizeInfo = "";

    if (["hooks", "plugins", "commands", "skills"].includes(comp)) {
      if (existsSync(join(profileDir, comp))) {
        const s = dirSize(join(profileDir, comp));
        if (s) sizeInfo = ` — ${s}`;
      }
    } else if (comp === "md_files" && existsSync(join(profileDir, "md_files"))) {
      const s = dirSize(join(profileDir, "md_files"));
      if (s) sizeInfo = ` — ${s}`;
    }

    process.stdout.write(`    ${GREEN}*${RESET} ${display}${DIM}${sizeInfo}${RESET}\n`);
  }

  const totalSize = dirSize(profileDir);
  process.stdout.write(`  ${DIM}total size:${RESET} ${totalSize}\n`);
}
