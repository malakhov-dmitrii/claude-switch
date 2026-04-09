import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  parseGetCredsResult,
  parseSetCredsResult,
  createFileKeychainIO,
} from "../src/lib/keychain";

// === parseGetCredsResult ===
describe("parseGetCredsResult", () => {
  it("returns null on non-zero exit", () => {
    expect(parseGetCredsResult(1, "some output", "")).toBeNull();
    expect(parseGetCredsResult(127, "anything", "err")).toBeNull();
  });

  it("returns null on zero exit with empty output", () => {
    expect(parseGetCredsResult(0, "", "")).toBeNull();
    expect(parseGetCredsResult(0, "   \n  ", "")).toBeNull();
  });

  it("returns trimmed string on success", () => {
    expect(parseGetCredsResult(0, '{"token":"abc"}\n', "")).toBe('{"token":"abc"}');
    expect(parseGetCredsResult(0, "  value  ", "")).toBe("value");
  });

  it("ignores stderr on success", () => {
    expect(parseGetCredsResult(0, "creds", "some warning")).toBe("creds");
  });
});

// === parseSetCredsResult ===
describe("parseSetCredsResult", () => {
  it("does not throw on exit code 0", () => {
    expect(() => parseSetCredsResult(0, "")).not.toThrow();
  });

  it("throws with message on non-zero exit", () => {
    expect(() => parseSetCredsResult(1, "keychain locked")).toThrow("keychain locked");
    expect(() => parseSetCredsResult(1, "  trimmed  ")).toThrow("trimmed");
  });
});

// === createFileKeychainIO ===
describe("createFileKeychainIO", () => {
  let dir: string;
  let credFile: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "claude-switch-keychain-test-"));
    credFile = join(dir, ".claude-switch-credentials");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("getCreds returns null when file does not exist", () => {
    const io = createFileKeychainIO(credFile);
    expect(io.getCreds()).toBeNull();
  });

  it("setCreds writes file with mode 0o600", () => {
    const io = createFileKeychainIO(credFile);
    io.setCreds('{"subscriptionType":"max"}');
    expect(existsSync(credFile)).toBe(true);
    if (process.platform !== "win32") {
      const mode = statSync(credFile).mode & 0o777;
      expect(mode).toBe(0o600);
    }
  });

  it("getCreds reads back what was written", () => {
    const io = createFileKeychainIO(credFile);
    const creds = '{"subscriptionType":"max","email":"test@example.com"}';
    io.setCreds(creds);
    expect(io.getCreds()).toBe(creds);
  });

  it("getCreds trims surrounding whitespace", () => {
    const io = createFileKeychainIO(credFile);
    // Write with trailing newline (simulates what some tools write)
    writeFileSync(credFile, '{"token":"abc"}\n', { mode: 0o600 });
    expect(io.getCreds()).toBe('{"token":"abc"}');
  });

  it("setCreds overwrites existing content", () => {
    const io = createFileKeychainIO(credFile);
    io.setCreds("first");
    io.setCreds("second");
    expect(io.getCreds()).toBe("second");
    expect(readFileSync(credFile, "utf-8").trim()).toBe("second");
  });

  it("getCreds returns null for empty file", () => {
    writeFileSync(credFile, "", { mode: 0o600 });
    const io = createFileKeychainIO(credFile);
    expect(io.getCreds()).toBeNull();
  });
});

// === createWindowsKeychainIO ===
describe("createWindowsKeychainIO", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "claude-switch-win-test-"));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("targets .credentials.json in the claude dir", () => {
    // createWindowsKeychainIO uses claudeDir() which defaults to ~/.claude
    // We can't override it directly, so test the underlying createFileKeychainIO
    // with the expected path to verify the contract
    const credFile = join(dir, ".credentials.json");
    const io = createFileKeychainIO(credFile);

    const creds = '{"accessToken":"test","expiresAt":"2026-01-01"}';
    io.setCreds(creds);
    expect(io.getCreds()).toBe(creds);
  });

  it("round-trips JSON credentials without corruption", () => {
    const credFile = join(dir, ".credentials.json");
    const io = createFileKeychainIO(credFile);

    // Simulate realistic Claude Code credential blob
    const creds = JSON.stringify({
      claudeAiOauth: {
        accessToken: "sk-ant-test-token-abc123",
        refreshToken: "rt-test-refresh-xyz789",
        expiresAt: "2026-12-31T23:59:59.000Z",
        scopes: ["user:read", "user:write"],
      },
      subscriptionType: "max",
      email: "user@example.com",
    });

    io.setCreds(creds);
    const restored = io.getCreds();
    expect(restored).toBe(creds);
    // Verify JSON structure survives round-trip
    expect(JSON.parse(restored!)).toEqual(JSON.parse(creds));
  });
});
