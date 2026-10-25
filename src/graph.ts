import { domainOf, groupIntoDomains } from "./domains.js";
import type { DomainEdge, DomainMap, SourceFile } from "./types.js";

const KEY_SEPARATOR = "\x1f";

export function buildDomainMap(files: SourceFile[], dependencyGraph: Map<string, Set<string>>): DomainMap {
  const domains = groupIntoDomains(files);
  const weights = new Map<string, number>();

  for (const [fromFile, targets] of dependencyGraph) {
    const fromDomain = domainOf(fromFile);
    for (const toFile of targets) {
      const toDomain = domainOf(toFile);
      if (fromDomain === toDomain) continue;
      const key = `${fromDomain}${KEY_SEPARATOR}${toDomain}`;
      weights.set(key, (weights.get(key) ?? 0) + 1);
    }
  }

  const edges: DomainEdge[] = [...weights.entries()]
    .map(([key, weight]) => {
      const [from, to] = key.split(KEY_SEPARATOR);
      return { from, to, weight };
    })
    .sort((a, b) => b.weight - a.weight || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

  return { domains, edges };
}
