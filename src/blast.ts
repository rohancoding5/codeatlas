import { domainOf } from "./domains.js";
import type { BlastRadius } from "./types.js";

export function blastRadius(dependencyGraph: Map<string, Set<string>>, target: string): BlastRadius {
  if (!dependencyGraph.has(target)) {
    return { target, exists: false, affectedFiles: [], affectedDomains: [] };
  }

  const reverseGraph = new Map<string, string[]>();
  for (const [from, targets] of dependencyGraph) {
    for (const to of targets) {
      const existing = reverseGraph.get(to);
      if (existing) existing.push(from);
      else reverseGraph.set(to, [from]);
    }
  }

  const visited = new Set<string>([target]);
  const queue: string[] = [target];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const dependents = reverseGraph.get(current) ?? [];
    for (const dependent of dependents) {
      if (visited.has(dependent)) continue;
      visited.add(dependent);
      queue.push(dependent);
    }
  }

  const affectedFiles = [...visited].filter((path) => path !== target).sort();
  const affectedDomains = [...new Set(affectedFiles.map(domainOf))].sort();

  return { target, exists: true, affectedFiles, affectedDomains };
}
