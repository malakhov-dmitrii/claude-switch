import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface Manifest {
  name: string;
  created: string;
  components: string[];
  boundAccount: string;
}

export function readManifest(manifestPath: string): Manifest {
  const raw = readFileSync(manifestPath, "utf-8");
  const data = JSON.parse(raw);
  return {
    name: data.name,
    created: data.created,
    components: data.components,
    boundAccount: data.boundAccount ?? "",
  };
}

export function writeManifest(dir: string, manifest: Manifest): void {
  const filePath = join(dir, "manifest.json");
  const json = JSON.stringify(manifest, null, 2) + "\n";
  writeFileSync(filePath, json, { mode: 0o600 });
}
