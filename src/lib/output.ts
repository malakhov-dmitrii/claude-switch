const isTTY = process.stdout.isTTY && !process.env.NO_COLOR;

export const BOLD = isTTY ? "\x1b[1m" : "";
export const DIM = isTTY ? "\x1b[2m" : "";
export const GREEN = isTTY ? "\x1b[32m" : "";
export const YELLOW = isTTY ? "\x1b[33m" : "";
export const RED = isTTY ? "\x1b[31m" : "";
export const CYAN = isTTY ? "\x1b[36m" : "";
export const RESET = isTTY ? "\x1b[0m" : "";

export function die(msg: string): never {
  process.stderr.write(`${RED}error:${RESET} ${msg}\n`);
  process.exit(1);
}

export function info(msg: string): void {
  process.stdout.write(`${GREEN}>>>${RESET} ${msg}\n`);
}

export function warn(msg: string): void {
  process.stderr.write(`${YELLOW}warning:${RESET} ${msg}\n`);
}

export function dim(msg: string): void {
  process.stdout.write(`${DIM}${msg}${RESET}\n`);
}
