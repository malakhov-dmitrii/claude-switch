import { cpSync, copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "fs";
import { join, extname } from "path";

export type ComponentName = "settings" | "hooks" | "plugins" | "commands" | "skills" | "md_files" | "mcp";

export const ALL_COMPONENTS: ComponentName[] = [
  "settings", "hooks", "plugins", "commands", "skills", "md_files", "mcp",
];

export const COMPONENT_DISPLAY: Record<ComponentName, string> = {
  settings: "settings    (settings.json, settings.local.json)",
  hooks: "hooks       (hooks/)",
  plugins: "plugins     (plugins/ — excl. cache)",
  commands: "commands    (commands/)",
  skills: "skills      (skills/)",
  md_files: "md files    (*.md at ~/.claude/ root)",
  mcp: "mcp         (mcp.json)",
};

export function componentExistsInSource(name: ComponentName, claudeDir: string): boolean {
  switch (name) {
    case "settings":
      return existsSync(join(claudeDir, "settings.json")) ||
        existsSync(join(claudeDir, "settings.local.json"));
    case "hooks": return existsSync(join(claudeDir, "hooks"));
    case "plugins": return existsSync(join(claudeDir, "plugins"));
    case "commands": return existsSync(join(claudeDir, "commands"));
    case "skills": return existsSync(join(claudeDir, "skills"));
    case "md_files":
      if (!existsSync(claudeDir)) return false;
      return readdirSync(claudeDir).some(f => extname(f) === ".md");
    case "mcp": return existsSync(join(claudeDir, "mcp.json"));
  }
}

export function copyComponentToProfile(name: ComponentName, claudeDir: string, profileDir: string): void {
  switch (name) {
    case "settings":
      for (const f of ["settings.json", "settings.local.json"]) {
        if (existsSync(join(claudeDir, f)))
          copyFileSync(join(claudeDir, f), join(profileDir, f));
      }
      break;
    case "hooks":
    case "commands":
    case "skills":
      if (existsSync(join(claudeDir, name)))
        cpSync(join(claudeDir, name), join(profileDir, name), { recursive: true });
      break;
    case "plugins":
      if (existsSync(join(claudeDir, "plugins"))) {
        cpSync(join(claudeDir, "plugins"), join(profileDir, "plugins"), {
          recursive: true,
          filter: (src: string) => !src.match(/[/\\]plugins[/\\]cache([/\\]|$)/),
        });
      }
      break;
    case "md_files":
      if (existsSync(claudeDir)) {
        const mdFiles = readdirSync(claudeDir).filter(f => extname(f) === ".md");
        if (mdFiles.length > 0) {
          mkdirSync(join(profileDir, "md_files"), { recursive: true });
          for (const f of mdFiles)
            copyFileSync(join(claudeDir, f), join(profileDir, "md_files", f));
        }
      }
      break;
    case "mcp":
      if (existsSync(join(claudeDir, "mcp.json")))
        copyFileSync(join(claudeDir, "mcp.json"), join(profileDir, "mcp.json"));
      break;
  }
}

export function restoreComponentFromProfile(name: ComponentName, profileDir: string, claudeDir: string): void {
  switch (name) {
    case "settings":
      for (const f of ["settings.json", "settings.local.json"]) {
        const dst = join(claudeDir, f);
        if (existsSync(dst)) rmSync(dst);
        if (existsSync(join(profileDir, f)))
          copyFileSync(join(profileDir, f), dst);
      }
      break;
    case "hooks":
    case "commands":
    case "skills":
      if (existsSync(join(profileDir, name))) {
        const dst = join(claudeDir, name);
        if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
        cpSync(join(profileDir, name), dst, { recursive: true });
      }
      break;
    case "plugins":
      if (existsSync(join(profileDir, "plugins"))) {
        if (existsSync(join(claudeDir, "plugins"))) {
          for (const item of readdirSync(join(claudeDir, "plugins"))) {
            if (item === "cache") continue;
            rmSync(join(claudeDir, "plugins", item), { recursive: true, force: true });
          }
        } else {
          mkdirSync(join(claudeDir, "plugins"), { recursive: true });
        }
        cpSync(join(profileDir, "plugins"), join(claudeDir, "plugins"), {
          recursive: true,
        });
      }
      break;
    case "md_files":
      // Intentionally replaces ALL *.md files. Files created after profile save
      // will be removed (but exist in auto-snapshot taken before restore).
      if (existsSync(join(profileDir, "md_files"))) {
        for (const f of readdirSync(claudeDir)) {
          if (extname(f) === ".md") rmSync(join(claudeDir, f));
        }
        for (const f of readdirSync(join(profileDir, "md_files"))) {
          if (extname(f) === ".md")
            copyFileSync(join(profileDir, "md_files", f), join(claudeDir, f));
        }
      }
      break;
    case "mcp": {
      const mcpDst = join(claudeDir, "mcp.json");
      if (existsSync(mcpDst)) rmSync(mcpDst);
      if (existsSync(join(profileDir, "mcp.json")))
        copyFileSync(join(profileDir, "mcp.json"), mcpDst);
      break;
    }
  }
}

export function copyComponentBetween(name: ComponentName, srcDir: string, dstDir: string): void {
  switch (name) {
    case "settings":
      for (const f of ["settings.json", "settings.local.json"]) {
        if (existsSync(join(srcDir, f)))
          copyFileSync(join(srcDir, f), join(dstDir, f));
      }
      break;
    case "hooks":
    case "commands":
    case "skills":
      if (existsSync(join(srcDir, name)))
        cpSync(join(srcDir, name), join(dstDir, name), { recursive: true });
      break;
    case "plugins":
      if (existsSync(join(srcDir, "plugins")))
        cpSync(join(srcDir, "plugins"), join(dstDir, "plugins"), { recursive: true });
      break;
    case "md_files":
      if (existsSync(join(srcDir, "md_files")))
        cpSync(join(srcDir, "md_files"), join(dstDir, "md_files"), { recursive: true });
      break;
    case "mcp":
      if (existsSync(join(srcDir, "mcp.json")))
        copyFileSync(join(srcDir, "mcp.json"), join(dstDir, "mcp.json"));
      break;
  }
}
