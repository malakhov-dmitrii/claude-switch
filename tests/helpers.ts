import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function createTestDir(): string {
  return mkdtempSync(join(tmpdir(), "claude-switch-test-"));
}

export function cleanTestDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
