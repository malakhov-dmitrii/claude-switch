import { configProfilesDir } from "../../lib/paths";
import { readManifest } from "../../lib/manifest";
import { BOLD, DIM, CYAN, RESET } from "../../lib/output";
import { dim } from "../../lib/output";
import { readdirSync, existsSync, statSync } from "fs";
import { join } from "path";

function dirSize(dir: string): string {
  try {
    const result = Bun.spawnSync(["du", "-sh", dir]);
    return result.stdout.toString().split("\t")[0]?.trim() ?? "?";
  } catch {
    return "?";
  }
}

export function cmdProfileList(configProfilesDirOverride?: string): void {
  const cpDir = configProfilesDir(configProfilesDirOverride);
  if (!existsSync(cpDir)) {
    dim("  no config profiles — run 'claude-switch profile save <name>' to create one");
    return;
  }

  let found = false;
  for (const d of readdirSync(cpDir).sort()) {
    const manifestPath = join(cpDir, d, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    found = true;

    const manifest = readManifest(manifestPath);
    const size = dirSize(join(cpDir, d));
    const boundMarker = manifest.boundAccount ? ` ${CYAN}-> ${manifest.boundAccount}${RESET}` : "";

    if (d.startsWith("_auto_")) {
      process.stdout.write(`  ${DIM}${d.padEnd(28)} ${size.padStart(6)}  [${manifest.components.join(",")}]${RESET}\n`);
    } else {
      process.stdout.write(`  ${BOLD}${d.padEnd(28)}${RESET} ${size.padStart(6)}  ${DIM}[${manifest.components.join(",")}]${RESET}${boundMarker}\n`);
    }
  }

  if (!found) {
    dim("  no config profiles — run 'claude-switch profile save <name>' to create one");
  }
}
