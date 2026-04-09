import { readdirSync, lstatSync } from "fs";
import { join } from "path";

export function dirSizeBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    try {
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        total += dirSizeBytes(full);
      } else {
        total += lstatSync(full).size;
      }
    } catch {
      // broken symlink or permission error — skip
    }
  }
  return total;
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}
