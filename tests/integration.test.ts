import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createTestDir, cleanTestDir } from "./helpers";
import { join } from "path";
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from "fs";

let testDir: string;
let claudeDir: string;
let profilesDir: string;
let configProfilesDir: string;
let env: Record<string, string>;

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = Bun.spawnSync(
    ["bun", "run", join(__dirname, "..", "src", "index.ts"), ...args],
    { env, cwd: testDir },
  );
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

beforeAll(() => {
  testDir = createTestDir();
  claudeDir = join(testDir, "claude");
  profilesDir = join(testDir, "profiles");
  configProfilesDir = join(testDir, "config-profiles");
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(profilesDir, { recursive: true });
  mkdirSync(configProfilesDir, { recursive: true });

  // Seed minimal claude dir
  writeFileSync(join(claudeDir, "settings.json"), '{"hooks":{},"permissions":{}}');
  writeFileSync(join(claudeDir, "mcp.json"), '{"servers":[]}');
  mkdirSync(join(claudeDir, "hooks"), { recursive: true });
  writeFileSync(join(claudeDir, "hooks", "pre.sh"), "#!/bin/bash\necho hook");
  writeFileSync(join(claudeDir, "CLAUDE.md"), "# My Instructions");

  env = {
    ...process.env,
    CLAUDE_DIR: claudeDir,
    CLAUDE_SWITCH_DIR: profilesDir,
    CLAUDE_SWITCH_CONFIG_DIR: configProfilesDir,
    NO_COLOR: "1",
  };
});

afterAll(() => { cleanTestDir(testDir); });

// === Account command regression ===
describe("account commands regression", () => {
  it("--version prints version", () => {
    const r = run(["--version"]);
    expect(r.stdout).toContain("claude-switch 2.0.0");
    expect(r.exitCode).toBe(0);
  });

  it("--help prints usage", () => {
    const r = run(["--help"]);
    expect(r.stdout).toContain("COMMANDS");
    expect(r.stdout).toContain("profile");
    expect(r.exitCode).toBe(0);
  });

  it("no args defaults to status", () => {
    const r = run([]);
    expect(r.exitCode).toBe(0);
  });

  it("unknown command exits 1", () => {
    const r = run(["bogus"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("unknown command");
  });

  it("list works with empty profiles dir", () => {
    const r = run(["list"]);
    expect(r.exitCode).toBe(0);
  });
});

// === Profile CRUD lifecycle ===
describe("profile CRUD lifecycle", () => {
  it("save creates profile with manifest", () => {
    const r = run(["profile", "save", "test-work"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("saved config profile");
    const manifest = JSON.parse(
      readFileSync(join(configProfilesDir, "test-work", "manifest.json"), "utf-8"),
    );
    expect(manifest.name).toBe("test-work");
    expect(manifest.components).toContain("settings");
    expect(manifest.components).toContain("hooks");
    expect(manifest.components).toContain("mcp");
    expect(manifest.components).toContain("md_files");
  });

  it("list shows saved profile", () => {
    const r = run(["profile", "list"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("test-work");
  });

  it("show displays profile details", () => {
    const r = run(["profile", "show", "test-work"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("test-work");
    expect(r.stdout).toContain("components:");
  });

  it("clone --all creates copy", () => {
    const r = run(["profile", "clone", "test-work", "test-clone", "--all"]);
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(configProfilesDir, "test-clone", "manifest.json"))).toBe(true);
  });

  it("clone --only hooks,mcp creates partial copy", () => {
    const r = run(["profile", "clone", "test-work", "test-partial", "--only", "hooks,mcp"]);
    expect(r.exitCode).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(configProfilesDir, "test-partial", "manifest.json"), "utf-8"),
    );
    expect(manifest.components).toEqual(["hooks", "mcp"]);
    expect(existsSync(join(configProfilesDir, "test-partial", "hooks"))).toBe(true);
    expect(existsSync(join(configProfilesDir, "test-partial", "settings.json"))).toBe(false);
  });

  it("delete removes profile", () => {
    const r = run(["profile", "delete", "test-clone"]);
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(configProfilesDir, "test-clone"))).toBe(false);
  });

  it("delete partial clone", () => {
    const r = run(["profile", "delete", "test-partial"]);
    expect(r.exitCode).toBe(0);
  });
});

// === Negative paths ===
describe("negative paths", () => {
  it("save with _auto_ prefix is rejected", () => {
    const r = run(["profile", "save", "_auto_bad"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("reserved");
  });

  it("use nonexistent profile fails", () => {
    const r = run(["profile", "use", "ghost"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("not found");
  });

  it("delete nonexistent profile fails", () => {
    const r = run(["profile", "delete", "ghost"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("not found");
  });

  it("show nonexistent profile fails", () => {
    const r = run(["profile", "show", "ghost"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("not found");
  });

  it("clone to existing target fails", () => {
    run(["profile", "save", "clone-src"]);
    run(["profile", "clone", "clone-src", "clone-dst", "--all"]);
    const r = run(["profile", "clone", "clone-src", "clone-dst", "--all"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("already exists");
    // cleanup
    run(["profile", "delete", "clone-src"]);
    run(["profile", "delete", "clone-dst"]);
  });

  it("clone --only with invalid component fails", () => {
    run(["profile", "save", "comp-src"]);
    const r = run(["profile", "clone", "comp-src", "comp-dst", "--only", "bogus"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("not in source");
    run(["profile", "delete", "comp-src"]);
  });

  it("unbind on unbound profile fails", () => {
    run(["profile", "save", "unbind-test"]);
    const r = run(["profile", "unbind", "unbind-test"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("has no bound account");
    run(["profile", "delete", "unbind-test"]);
  });

  it("invalid profile name is rejected", () => {
    const r = run(["profile", "save", "bad name!"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("must contain only");
  });
});

// === Auto-snapshot ===
describe("auto-snapshot", () => {
  it("profile use creates auto-snapshot before restoring", () => {
    run(["profile", "save", "snap-test"]);
    writeFileSync(join(claudeDir, "settings.json"), '{"modified":true}');
    const r = run(["profile", "use", "snap-test"]);
    expect(r.exitCode).toBe(0);
    const autoSnaps = readdirSync(configProfilesDir).filter(d => d.startsWith("_auto_"));
    expect(autoSnaps.length).toBeGreaterThan(0);
  });

  it("prunes to exactly 5 when exceeded", () => {
    // Seed 7 auto-snapshots directly
    for (let i = 1; i <= 7; i++) {
      const ts = `202603${String(i).padStart(2, "0")}_120000`;
      const name = `_auto_${ts}`;
      const dir = join(configProfilesDir, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "manifest.json"), JSON.stringify({
        name, created: `2026-03-${String(i).padStart(2, "0")}T12:00:00Z`,
        components: ["settings"], boundAccount: "",
      }));
      writeFileSync(join(dir, "settings.json"), "{}");
    }

    // Trigger use which calls autoSnapshot -> prune
    const r = run(["profile", "use", "snap-test"]);
    expect(r.exitCode).toBe(0);

    const autoSnaps = readdirSync(configProfilesDir).filter(d => d.startsWith("_auto_")).sort();
    // After prune + new snapshot: should be exactly 5
    expect(autoSnaps.length).toBe(5);

    // Cleanup
    run(["profile", "delete", "snap-test"]);
  });
});

// === Bind/unbind ===
describe("bind and unbind", () => {
  beforeAll(() => {
    writeFileSync(join(profilesDir, "myaccount.json"), '{"subscriptionType":"max"}');
  });

  it("bind sets boundAccount in manifest", () => {
    run(["profile", "save", "bind-test"]);
    const r = run(["profile", "bind", "bind-test", "myaccount"]);
    expect(r.exitCode).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(configProfilesDir, "bind-test", "manifest.json"), "utf-8"),
    );
    expect(manifest.boundAccount).toBe("myaccount");
    expect(manifest.name).toBe("bind-test");
    expect(manifest.components.length).toBeGreaterThan(0);
  });

  it("unbind clears boundAccount", () => {
    const r = run(["profile", "unbind", "bind-test"]);
    expect(r.exitCode).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(configProfilesDir, "bind-test", "manifest.json"), "utf-8"),
    );
    expect(manifest.boundAccount).toBe("");
    // Cleanup
    run(["profile", "delete", "bind-test"]);
  });

  it("bind with nonexistent account fails", () => {
    run(["profile", "save", "bind-fail"]);
    const r = run(["profile", "bind", "bind-fail", "ghost-account"]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("not found");
    run(["profile", "delete", "bind-fail"]);
  });
});

// === Command aliases ===
describe("command aliases", () => {
  it("'ls' routes to list", () => {
    const r = run(["ls"]);
    expect(r.exitCode).toBe(0);
  });

  it("'profile ls' routes to profile list", () => {
    const r = run(["profile", "ls"]);
    expect(r.exitCode).toBe(0);
  });

  it("'profile --help' shows profile help", () => {
    const r = run(["profile", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("COMMANDS");
  });
});
