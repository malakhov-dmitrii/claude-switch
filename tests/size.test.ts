import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { dirSizeBytes, humanSize } from "../src/lib/size";

describe("dirSizeBytes", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "claude-switch-size-test-"));
    // Create a known structure: 3 files of known sizes
    writeFileSync(join(dir, "a.txt"), "x".repeat(100));
    writeFileSync(join(dir, "b.txt"), "y".repeat(200));
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "c.txt"), "z".repeat(300));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("sums file sizes recursively", () => {
    expect(dirSizeBytes(dir)).toBe(600);
  });

  it("returns 0 for empty directory", () => {
    const empty = mkdtempSync(join(tmpdir(), "claude-switch-size-empty-"));
    expect(dirSizeBytes(empty)).toBe(0);
    rmSync(empty, { recursive: true, force: true });
  });
});

describe("humanSize", () => {
  it("formats bytes", () => {
    expect(humanSize(0)).toBe("0B");
    expect(humanSize(500)).toBe("500B");
  });

  it("formats kilobytes", () => {
    expect(humanSize(1024)).toBe("1K");
    expect(humanSize(2048)).toBe("2K");
  });

  it("formats megabytes", () => {
    expect(humanSize(5_000_000)).toBe("4.8M");
  });

  it("formats gigabytes", () => {
    expect(humanSize(2_500_000_000)).toBe("2.3G");
  });
});
