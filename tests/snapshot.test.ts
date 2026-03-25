import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { autoSnapshot, pruneAutoSnapshots, MAX_AUTO_SNAPSHOTS } from "../src/lib/snapshot";
import { readManifest } from "../src/lib/manifest";
import { createTestDir, cleanTestDir } from "./helpers";
import { join } from "path";
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "fs";

let testDir: string;
let claudeDir: string;
let cfgProfilesDir: string;

beforeEach(() => {
  testDir = createTestDir();
  claudeDir = join(testDir, "claude");
  cfgProfilesDir = join(testDir, "config-profiles");
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(cfgProfilesDir, { recursive: true });
});
afterEach(() => { cleanTestDir(testDir); });

describe("MAX_AUTO_SNAPSHOTS", () => {
  it("is 5", () => {
    expect(MAX_AUTO_SNAPSHOTS).toBe(5);
  });
});

describe("autoSnapshot", () => {
  it("creates a snapshot with _auto_ prefix when config exists", () => {
    writeFileSync(join(claudeDir, "settings.json"), "{}");
    const name = autoSnapshot(claudeDir, cfgProfilesDir);
    expect(name).not.toBeNull();
    expect(name!.startsWith("_auto_")).toBe(true);
    const m = readManifest(join(cfgProfilesDir, name!, "manifest.json"));
    expect(m.components).toContain("settings");
  });

  it("returns null when claude dir has no recognized components", () => {
    const name = autoSnapshot(claudeDir, cfgProfilesDir);
    expect(name).toBeNull();
  });

  it("saves all found components to manifest", () => {
    writeFileSync(join(claudeDir, "settings.json"), "{}");
    writeFileSync(join(claudeDir, "mcp.json"), "{}");
    mkdirSync(join(claudeDir, "hooks"), { recursive: true });
    writeFileSync(join(claudeDir, "hooks", "test.sh"), "#!/bin/bash");
    const name = autoSnapshot(claudeDir, cfgProfilesDir);
    const m = readManifest(join(cfgProfilesDir, name!, "manifest.json"));
    expect(m.components).toContain("settings");
    expect(m.components).toContain("hooks");
    expect(m.components).toContain("mcp");
  });
});

describe("pruneAutoSnapshots", () => {
  function seedAutoSnapshots(count: number): string[] {
    const names: string[] = [];
    for (let i = 1; i <= count; i++) {
      const ts = `202603${String(i).padStart(2, "0")}_120000`;
      const name = `_auto_${ts}`;
      const dir = join(cfgProfilesDir, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "manifest.json"), JSON.stringify({
        name, created: `2026-03-${String(i).padStart(2, "0")}T12:00:00Z`,
        components: ["settings"], boundAccount: "",
      }));
      names.push(name);
    }
    return names;
  }

  it("removes oldest when count exceeds MAX (seed 7, verify exactly 5 remain)", () => {
    const names = seedAutoSnapshots(7);
    pruneAutoSnapshots(cfgProfilesDir, 5);
    const remaining = readdirSync(cfgProfilesDir).filter(d => d.startsWith("_auto_"));
    expect(remaining.length).toBe(5);
    expect(remaining).not.toContain(names[0]);
    expect(remaining).not.toContain(names[1]);
    for (let i = 2; i < 7; i++) {
      expect(remaining).toContain(names[i]);
    }
  });

  it("is a no-op when count equals MAX", () => {
    seedAutoSnapshots(5);
    pruneAutoSnapshots(cfgProfilesDir, 5);
    const remaining = readdirSync(cfgProfilesDir).filter(d => d.startsWith("_auto_"));
    expect(remaining.length).toBe(5);
  });

  it("is a no-op when count is below MAX", () => {
    seedAutoSnapshots(3);
    pruneAutoSnapshots(cfgProfilesDir, 5);
    const remaining = readdirSync(cfgProfilesDir).filter(d => d.startsWith("_auto_"));
    expect(remaining.length).toBe(3);
  });

  it("does not delete non-auto-snapshot directories", () => {
    seedAutoSnapshots(7);
    for (const n of ["work", "personal"]) {
      const d = join(cfgProfilesDir, n);
      mkdirSync(d, { recursive: true });
      writeFileSync(join(d, "manifest.json"), JSON.stringify({
        name: n, created: "2026-01-01T00:00:00Z",
        components: ["settings"], boundAccount: "",
      }));
    }
    pruneAutoSnapshots(cfgProfilesDir, 5);
    expect(existsSync(join(cfgProfilesDir, "work"))).toBe(true);
    expect(existsSync(join(cfgProfilesDir, "personal"))).toBe(true);
    const autoRemaining = readdirSync(cfgProfilesDir).filter(d => d.startsWith("_auto_"));
    expect(autoRemaining.length).toBe(5);
  });
});
