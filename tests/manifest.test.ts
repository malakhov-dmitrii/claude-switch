import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { readManifest, writeManifest, type Manifest } from "../src/lib/manifest";
import { createTestDir, cleanTestDir } from "./helpers";
import { join } from "path";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";

let testDir: string;

beforeEach(() => { testDir = createTestDir(); });
afterEach(() => { cleanTestDir(testDir); });

describe("writeManifest", () => {
  it("writes all fields to manifest.json", () => {
    const profileDir = join(testDir, "myprofile");
    mkdirSync(profileDir, { recursive: true });
    const m: Manifest = {
      name: "myprofile",
      created: "2026-03-25T14:30:00Z",
      components: ["settings", "hooks", "mcp"],
      boundAccount: "",
    };
    writeManifest(profileDir, m);
    const raw = readFileSync(join(profileDir, "manifest.json"), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.name).toBe("myprofile");
    expect(parsed.components).toEqual(["settings", "hooks", "mcp"]);
    expect(parsed.boundAccount).toBe("");
    expect(parsed.created).toBe("2026-03-25T14:30:00Z");
  });

  it("creates file with mode 0o600", () => {
    const profileDir = join(testDir, "secure");
    mkdirSync(profileDir, { recursive: true });
    writeManifest(profileDir, {
      name: "secure", created: "2026-01-01T00:00:00Z",
      components: ["settings"], boundAccount: "",
    });
    const stat = statSync(join(profileDir, "manifest.json"));
    expect(stat.mode & 0o777).toBe(0o600);
  });

  it("preserves empty boundAccount as empty string", () => {
    const profileDir = join(testDir, "unbound");
    mkdirSync(profileDir, { recursive: true });
    writeManifest(profileDir, {
      name: "unbound", created: "2026-01-01T00:00:00Z",
      components: ["settings"], boundAccount: "",
    });
    const parsed = JSON.parse(readFileSync(join(profileDir, "manifest.json"), "utf-8"));
    expect(parsed.boundAccount).toBe("");
  });
});

describe("readManifest", () => {
  it("returns typed Manifest from valid JSON file", () => {
    const profileDir = join(testDir, "valid");
    mkdirSync(profileDir, { recursive: true });
    writeFileSync(join(profileDir, "manifest.json"), JSON.stringify({
      name: "valid", created: "2026-03-25T00:00:00Z",
      components: ["hooks", "plugins"], boundAccount: "work",
    }));
    const m = readManifest(join(profileDir, "manifest.json"));
    expect(m.name).toBe("valid");
    expect(m.components).toEqual(["hooks", "plugins"]);
    expect(m.boundAccount).toBe("work");
  });

  it("throws if file does not exist", () => {
    expect(() => readManifest(join(testDir, "ghost", "manifest.json"))).toThrow();
  });

  it("throws if JSON is malformed", () => {
    const profileDir = join(testDir, "malformed");
    mkdirSync(profileDir, { recursive: true });
    writeFileSync(join(profileDir, "manifest.json"), "not json {{{");
    expect(() => readManifest(join(profileDir, "manifest.json"))).toThrow();
  });

  it("round-trips through writeManifest with all fields preserved", () => {
    const profileDir = join(testDir, "roundtrip");
    mkdirSync(profileDir, { recursive: true });
    const original: Manifest = {
      name: "roundtrip", created: "2026-06-15T12:00:00Z",
      components: ["settings", "hooks", "plugins", "commands", "skills", "md_files", "mcp"],
      boundAccount: "personal",
    };
    writeManifest(profileDir, original);
    const restored = readManifest(join(profileDir, "manifest.json"));
    expect(restored).toEqual(original);
  });
});
