import type { KeychainIO } from "../lib/keychain";
import { profilesDir } from "../lib/paths";
import { BOLD, DIM, CYAN, YELLOW, RESET } from "../lib/output";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, extname } from "path";

function extractField(json: string, field: string): string {
  const match = json.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`));
  return match?.[1] ?? "";
}

export function cmdStatus(keychain: KeychainIO, profilesDirOverride?: string): void {
  const dir = profilesDir(profilesDirOverride);

  // Try claude auth status
  let output = "";
  try {
    const result = Bun.spawnSync(["claude", "auth", "status", "--json"]);
    output = result.stdout.toString();
    if (!output) output = Bun.spawnSync(["claude", "auth", "status"]).stdout.toString();
  } catch {
    // claude CLI may not be available
  }

  if (output.includes('"email"')) {
    const email = extractField(output, "email");
    const sub = extractField(output, "subscriptionType");
    process.stdout.write(`${BOLD}${email}${RESET} ${DIM}(${sub || "unknown"})${RESET}\n`);
  } else if (output.trim()) {
    process.stdout.write(output.trim() + "\n");
  }

  // Match against saved profiles
  const current = keychain.getCreds();
  if (current && existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (extname(f) !== ".json") continue;
      const saved = readFileSync(join(dir, f), "utf-8");
      if (current === saved) {
        const name = f.replace(/\.json$/, "");
        process.stdout.write(`${CYAN}profile:${RESET} ${name}\n`);
        return;
      }
    }
    process.stdout.write(`${YELLOW}profile:${RESET} (unsaved)\n`);
  }
}
