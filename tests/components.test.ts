import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  ALL_COMPONENTS, copyComponentToProfile, restoreComponentFromProfile, copyComponentBetween,
} from "../src/lib/components";
import { createTestDir, cleanTestDir } from "./helpers";
import { join } from "path";
import {
  mkdirSync, writeFileSync, readFileSync, existsSync,
  symlinkSync, readlinkSync, readdirSync,
} from "fs";

let testDir: string;
let claudeDir: string;
let profileDir: string;

beforeEach(() => {
  testDir = createTestDir();
  claudeDir = join(testDir, "claude");
  profileDir = join(testDir, "profile");
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(profileDir, { recursive: true });
});
afterEach(() => { cleanTestDir(testDir); });

describe("ALL_COMPONENTS", () => {
  it("contains exactly 7 component names", () => {
    expect(ALL_COMPONENTS).toEqual([
      "settings", "hooks", "plugins", "commands", "skills", "md_files", "mcp",
    ]);
  });
});

describe("copyComponentToProfile — settings", () => {
  it("copies settings.json and settings.local.json", () => {
    writeFileSync(join(claudeDir, "settings.json"), '{"key":"val"}');
    writeFileSync(join(claudeDir, "settings.local.json"), '{"local":true}');
    copyComponentToProfile("settings", claudeDir, profileDir);
    expect(readFileSync(join(profileDir, "settings.json"), "utf-8")).toBe('{"key":"val"}');
    expect(readFileSync(join(profileDir, "settings.local.json"), "utf-8")).toBe('{"local":true}');
  });

  it("skips missing settings.local.json without error", () => {
    writeFileSync(join(claudeDir, "settings.json"), "{}");
    copyComponentToProfile("settings", claudeDir, profileDir);
    expect(existsSync(join(profileDir, "settings.json"))).toBe(true);
    expect(existsSync(join(profileDir, "settings.local.json"))).toBe(false);
  });
});

describe("copyComponentToProfile — hooks", () => {
  it("copies hooks/ directory recursively", () => {
    mkdirSync(join(claudeDir, "hooks", "subdir"), { recursive: true });
    writeFileSync(join(claudeDir, "hooks", "pre.sh"), "#!/bin/bash");
    writeFileSync(join(claudeDir, "hooks", "subdir", "nested.js"), "//js");
    copyComponentToProfile("hooks", claudeDir, profileDir);
    expect(readFileSync(join(profileDir, "hooks", "pre.sh"), "utf-8")).toBe("#!/bin/bash");
    expect(readFileSync(join(profileDir, "hooks", "subdir", "nested.js"), "utf-8")).toBe("//js");
  });
});

describe("copyComponentToProfile — plugins", () => {
  it("excludes cache/ subdirectory", () => {
    mkdirSync(join(claudeDir, "plugins", "beast"), { recursive: true });
    mkdirSync(join(claudeDir, "plugins", "cache", "tmp"), { recursive: true });
    writeFileSync(join(claudeDir, "plugins", "beast", "index.js"), "//beast");
    writeFileSync(join(claudeDir, "plugins", "cache", "tmp", "data"), "cached");
    copyComponentToProfile("plugins", claudeDir, profileDir);
    expect(existsSync(join(profileDir, "plugins", "beast", "index.js"))).toBe(true);
    expect(existsSync(join(profileDir, "plugins", "cache"))).toBe(false);
  });
});

describe("copyComponentToProfile — commands (symlinks)", () => {
  it("preserves relative symlinks", () => {
    mkdirSync(join(claudeDir, "commands"), { recursive: true });
    mkdirSync(join(claudeDir, "external"), { recursive: true });
    writeFileSync(join(claudeDir, "external", "target.md"), "content");
    symlinkSync("../external/target.md", join(claudeDir, "commands", "link.md"));
    copyComponentToProfile("commands", claudeDir, profileDir);
    const linkTarget = readlinkSync(join(profileDir, "commands", "link.md"));
    expect(linkTarget).toBe("../external/target.md");
  });

  it("handles broken symlinks without throwing", () => {
    mkdirSync(join(claudeDir, "commands"), { recursive: true });
    symlinkSync("../nonexistent/file.md", join(claudeDir, "commands", "broken.md"));
    expect(() => {
      copyComponentToProfile("commands", claudeDir, profileDir);
    }).not.toThrow();
    const linkTarget = readlinkSync(join(profileDir, "commands", "broken.md"));
    expect(linkTarget).toBe("../nonexistent/file.md");
  });
});

describe("copyComponentToProfile — md_files", () => {
  it("copies *.md files from claude root to md_files/", () => {
    writeFileSync(join(claudeDir, "CLAUDE.md"), "# Instructions");
    writeFileSync(join(claudeDir, "RTK.md"), "# RTK");
    writeFileSync(join(claudeDir, "not-md.txt"), "ignored");
    copyComponentToProfile("md_files", claudeDir, profileDir);
    expect(readFileSync(join(profileDir, "md_files", "CLAUDE.md"), "utf-8")).toBe("# Instructions");
    expect(readFileSync(join(profileDir, "md_files", "RTK.md"), "utf-8")).toBe("# RTK");
    expect(existsSync(join(profileDir, "md_files", "not-md.txt"))).toBe(false);
  });
});

describe("copyComponentToProfile — mcp", () => {
  it("copies mcp.json", () => {
    writeFileSync(join(claudeDir, "mcp.json"), '{"servers":[]}');
    copyComponentToProfile("mcp", claudeDir, profileDir);
    expect(readFileSync(join(profileDir, "mcp.json"), "utf-8")).toBe('{"servers":[]}');
  });
});

describe("copyComponentToProfile — missing source", () => {
  it("does nothing for missing hooks directory", () => {
    expect(() => copyComponentToProfile("hooks", claudeDir, profileDir)).not.toThrow();
    expect(existsSync(join(profileDir, "hooks"))).toBe(false);
  });
});

describe("restoreComponentFromProfile", () => {
  it("restores settings, replacing existing files", () => {
    writeFileSync(join(claudeDir, "settings.json"), '{"old":true}');
    writeFileSync(join(profileDir, "settings.json"), '{"new":true}');
    restoreComponentFromProfile("settings", profileDir, claudeDir);
    expect(readFileSync(join(claudeDir, "settings.json"), "utf-8")).toBe('{"new":true}');
  });

  it("restores plugins without destroying cache/", () => {
    mkdirSync(join(claudeDir, "plugins", "cache", "important"), { recursive: true });
    mkdirSync(join(claudeDir, "plugins", "old-plugin"), { recursive: true });
    writeFileSync(join(claudeDir, "plugins", "cache", "important", "data"), "keep me");
    writeFileSync(join(claudeDir, "plugins", "old-plugin", "index.js"), "old");
    mkdirSync(join(profileDir, "plugins", "new-plugin"), { recursive: true });
    writeFileSync(join(profileDir, "plugins", "new-plugin", "index.js"), "new");
    restoreComponentFromProfile("plugins", profileDir, claudeDir);
    expect(readFileSync(join(claudeDir, "plugins", "cache", "important", "data"), "utf-8")).toBe("keep me");
    expect(existsSync(join(claudeDir, "plugins", "old-plugin"))).toBe(false);
    expect(readFileSync(join(claudeDir, "plugins", "new-plugin", "index.js"), "utf-8")).toBe("new");
  });

  it("restores md_files, removing old *.md from claude root", () => {
    writeFileSync(join(claudeDir, "OLD.md"), "old stuff");
    writeFileSync(join(claudeDir, "keep.txt"), "not md");
    mkdirSync(join(profileDir, "md_files"), { recursive: true });
    writeFileSync(join(profileDir, "md_files", "NEW.md"), "new stuff");
    restoreComponentFromProfile("md_files", profileDir, claudeDir);
    expect(existsSync(join(claudeDir, "OLD.md"))).toBe(false);
    expect(readFileSync(join(claudeDir, "NEW.md"), "utf-8")).toBe("new stuff");
    expect(readFileSync(join(claudeDir, "keep.txt"), "utf-8")).toBe("not md");
  });
});

describe("copyComponentBetween", () => {
  it("copies settings between two profile directories", () => {
    const srcDir = join(testDir, "src-profile");
    const dstDir = join(testDir, "dst-profile");
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(dstDir, { recursive: true });
    writeFileSync(join(srcDir, "settings.json"), '{"from":"src"}');
    copyComponentBetween("settings", srcDir, dstDir);
    expect(readFileSync(join(dstDir, "settings.json"), "utf-8")).toBe('{"from":"src"}');
  });
});
