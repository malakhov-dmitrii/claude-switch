import type { KeychainIO } from "../lib/keychain";
import { profilesDir } from "../lib/paths";
import { BOLD, DIM, GREEN, RESET } from "../lib/output";
import { dim } from "../lib/output";
import { readdirSync, readFileSync, existsSync, mkdirSync, chmodSync } from "fs";
import { join, extname } from "path";

function extractField(json: string, field: string): string {
  const match = json.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`));
  return match?.[1] ?? "";
}

export function cmdList(keychain: KeychainIO, profilesDirOverride?: string): void {
  const dir = profilesDir(profilesDirOverride);
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, 0o700);

  const current = keychain.getCreds();
  let found = false;

  for (const f of readdirSync(dir)) {
    if (extname(f) !== ".json") continue;
    found = true;
    const name = f.replace(/\.json$/, "");
    const content = readFileSync(join(dir, f), "utf-8");
    const sub = extractField(content, "subscriptionType");
    const tier = extractField(content, "rateLimitTier");
    const marker = current && current === content ? `${GREEN} *${RESET}` : "";

    const label = `${sub || "unknown"}${tier ? ` / ${tier}` : ""}`;
    process.stdout.write(`  ${BOLD}${name.padEnd(16)}${RESET} ${DIM}${label}${RESET}${marker}\n`);
  }

  if (!found) {
    dim("  no saved profiles — run 'claude-switch save <name>' to create one");
  }
}
