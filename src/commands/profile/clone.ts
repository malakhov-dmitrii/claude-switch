import { configProfilesDir } from "../../lib/paths";
import { validateName } from "../../lib/validate";
import { die, info, dim } from "../../lib/output";
import { readManifest, writeManifest } from "../../lib/manifest";
import { copyComponentBetween } from "../../lib/components";
import { interactivePicker } from "../../lib/picker";
import { existsSync, mkdirSync, chmodSync } from "fs";
import { join } from "path";
import type { ComponentName } from "../../lib/components";

export async function cmdProfileClone(args: string[], configProfilesDirOverride?: string): Promise<void> {
  let source = "";
  let target = "";
  let mode: "interactive" | "all" | "only" = "interactive";
  let onlyComponents = "";

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--all") {
      mode = "all";
    } else if (arg === "--only") {
      mode = "only";
      i++;
      onlyComponents = args[i];
      if (!onlyComponents) die("--only requires component list (e.g., hooks,settings)");
    } else if (arg?.startsWith("-")) {
      die(`unknown option '${arg}'`);
    } else if (!source) {
      source = arg!;
    } else if (!target) {
      target = arg!;
    } else {
      die(`unexpected argument '${arg}'`);
    }
    i++;
  }

  if (!source || !target) die("usage: claude-switch profile clone <source> <target> [--all|--only X,Y]");
  validateName(source);
  validateName(target);

  const cpDir = configProfilesDir(configProfilesDirOverride);
  const sourceDir = join(cpDir, source);
  const targetDir = join(cpDir, target);

  if (!existsSync(sourceDir) || !existsSync(join(sourceDir, "manifest.json"))) {
    die(`source profile '${source}' not found`);
  }
  if (existsSync(targetDir) && existsSync(join(targetDir, "manifest.json"))) {
    die(`target profile '${target}' already exists — delete it first`);
  }

  const sourceManifest = readManifest(join(sourceDir, "manifest.json"));
  let cloneComponents: ComponentName[];

  switch (mode) {
    case "all":
      cloneComponents = sourceManifest.components as ComponentName[];
      break;
    case "only": {
      const requested = onlyComponents.split(",") as ComponentName[];
      for (const comp of requested) {
        if (!sourceManifest.components.includes(comp)) {
          die(`component '${comp}' not in source profile (available: ${sourceManifest.components.join(",")})`);
        }
      }
      cloneComponents = requested;
      break;
    }
    case "interactive":
      cloneComponents = await interactivePicker(sourceManifest.components as ComponentName[]);
      if (cloneComponents.length === 0) die("no components selected — clone cancelled");
      break;
  }

  mkdirSync(targetDir, { recursive: true, mode: 0o700 });

  for (const comp of cloneComponents) {
    copyComponentBetween(comp, sourceDir, targetDir);
  }

  writeManifest(targetDir, {
    name: target,
    created: new Date().toISOString(),
    components: cloneComponents,
    boundAccount: sourceManifest.boundAccount,
  });

  info(`cloned '${source}' -> '${target}'`);
  dim(`components: ${cloneComponents.join(",")}`);
}
