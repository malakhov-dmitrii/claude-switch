import { createInterface } from "readline";
import { BOLD, DIM, RESET } from "./output";
import { COMPONENT_DISPLAY } from "./components";
import { die } from "./output";
import type { ComponentName } from "./components";

export function interactivePicker(available: ComponentName[]): Promise<ComponentName[]> {
  if (!process.stdin.isTTY) {
    die("interactive mode requires a terminal — use --all or --only");
  }

  return new Promise((resolve) => {
    const selected = new Array(available.length).fill(true);

    const render = () => {
      process.stdout.write("\x1b[2J\x1b[H");
      process.stdout.write(`${BOLD}Select components to clone:${RESET}\n\n`);
      for (let i = 0; i < available.length; i++) {
        const marker = selected[i] ? "x" : " ";
        const display = COMPONENT_DISPLAY[available[i]] || available[i];
        process.stdout.write(`  [${marker}] ${i + 1}. ${display}\n`);
      }
      process.stdout.write(`\n${DIM}Enter number to toggle, 'a' for all, 'n' for none, 'd' for done:${RESET} `);
    };

    render();

    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

    rl.on("line", (line: string) => {
      const choice = line.trim().toLowerCase();
      if (choice === "d" || choice === "") {
        rl.close();
        resolve(available.filter((_, i) => selected[i]));
        return;
      }
      if (choice === "a") {
        selected.fill(true);
      } else if (choice === "n") {
        selected.fill(false);
      } else {
        const num = parseInt(choice, 10);
        if (num >= 1 && num <= available.length) {
          selected[num - 1] = !selected[num - 1];
        }
      }
      render();
    });

    rl.on("close", () => {
      resolve(available.filter((_, i) => selected[i]));
    });
  });
}
