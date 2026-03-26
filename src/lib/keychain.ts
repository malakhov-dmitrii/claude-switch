import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { KEYCHAIN_SERVICE, keychainAccount, claudeDir } from "./paths";
import { die } from "./output";

export interface KeychainIO {
  getCreds(): string | null;
  setCreds(creds: string): void;
}

export function parseGetCredsResult(exitCode: number, stdout: string, _stderr: string): string | null {
  if (exitCode !== 0) return null;
  const trimmed = stdout.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseSetCredsResult(exitCode: number, stderr: string): void {
  if (exitCode !== 0) {
    throw new Error(`failed to write credentials to Keychain: ${stderr.trim()}`);
  }
}

export function createDarwinKeychainIO(): KeychainIO {
  const service = KEYCHAIN_SERVICE;
  const account = keychainAccount();

  return {
    getCreds(): string | null {
      const result = Bun.spawnSync([
        "security", "find-generic-password",
        "-s", service, "-a", account, "-w",
      ]);
      return parseGetCredsResult(
        result.exitCode,
        result.stdout.toString(),
        result.stderr.toString(),
      );
    },

    setCreds(creds: string): void {
      Bun.spawnSync([
        "security", "delete-generic-password",
        "-s", service, "-a", account,
      ]);
      const result = Bun.spawnSync([
        "security", "add-generic-password",
        "-s", service, "-a", account, "-w", creds,
      ]);
      parseSetCredsResult(result.exitCode, result.stderr.toString());
    },
  };
}

export function createFileKeychainIO(credFile?: string): KeychainIO {
  const file = credFile ?? join(claudeDir(), ".claude-switch-credentials");

  return {
    getCreds(): string | null {
      if (!existsSync(file)) return null;
      const content = readFileSync(file, "utf-8").trim();
      return content.length > 0 ? content : null;
    },

    setCreds(creds: string): void {
      writeFileSync(file, creds, { mode: 0o600 });
    },
  };
}

export function createSecretToolKeychainIO(service: string, account: string): KeychainIO {
  return {
    getCreds(): string | null {
      const result = Bun.spawnSync([
        "secret-tool", "lookup",
        "service", service,
        "username", account,
      ]);
      return parseGetCredsResult(
        result.exitCode,
        result.stdout.toString(),
        result.stderr.toString(),
      );
    },

    setCreds(creds: string): void {
      const result = Bun.spawnSync(
        [
          "secret-tool", "store",
          "--label", service,
          "service", service,
          "username", account,
        ],
        { stdin: new TextEncoder().encode(creds) },
      );
      if (result.exitCode !== 0) {
        throw new Error(`failed to write credentials via secret-tool: ${result.stderr.toString().trim()}`);
      }
    },
  };
}

export function createLinuxKeychainIO(): KeychainIO {
  if (process.env.CLAUDE_SWITCH_KEYCHAIN_BACKEND === "file" || Bun.which("secret-tool") === null) {
    return createFileKeychainIO();
  }
  return createSecretToolKeychainIO(KEYCHAIN_SERVICE, keychainAccount());
}

export function createKeychainIO(): KeychainIO {
  switch (process.platform) {
    case "darwin": return createDarwinKeychainIO();
    case "linux":  return createLinuxKeychainIO();
    default: die(`unsupported platform: ${process.platform} — claude-switch supports macOS and Linux`);
  }
}
