import type { Domain, SourceFile } from "./types.js";

const ROOT_DOMAIN = "root";
const SRC_LIKE_DIRS = new Set(["src", "lib", "app"]);

export function domainOf(path: string): string {
  const parts = path.split(/[/\\]/);
  if (parts.length === 1) return ROOT_DOMAIN;
  if (SRC_LIKE_DIRS.has(parts[0]) && parts.length > 2) return parts[1];
  return parts[0];
}

export function groupIntoDomains(files: SourceFile[]): Domain[] {
  const byDomain = new Map<string, string[]>();

  for (const file of files) {
    const domain = domainOf(file.path);
    const existing = byDomain.get(domain);
    if (existing) existing.push(file.path);
    else byDomain.set(domain, [file.path]);
  }

  return [...byDomain.entries()]
    .map(([name, domainFiles]) => ({ name, files: domainFiles.sort() }))
    .sort((a, b) => b.files.length - a.files.length || a.name.localeCompare(b.name));
}
