import { die } from "./output";

export function validateName(name: string): void {
  if (!name) die("profile name is required");
  if (!/^[a-zA-Z0-9_-]+$/.test(name))
    die("profile name must contain only letters, numbers, hyphens, and underscores");
}
