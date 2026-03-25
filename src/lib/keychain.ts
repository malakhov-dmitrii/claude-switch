import { KEYCHAIN_SERVICE, keychainAccount } from "./paths";

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

export function createKeychainIO(): KeychainIO {
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
