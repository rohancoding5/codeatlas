import type { BlastRadius, DomainMap, MapNarrative } from "./types.js";

export function renderMap(map: DomainMap, narrative: MapNarrative | null): string {
  const lines: string[] = [];
  lines.push(`DOMAINS -- ${map.domains.length}`);
  lines.push("");
  for (const domain of map.domains) {
    lines.push(`  ${domain.name}  (${domain.files.length} file${domain.files.length === 1 ? "" : "s"})`);
  }
  lines.push("");
  lines.push(`DOMAIN GRAPH -- ${map.edges.length} edge${map.edges.length === 1 ? "" : "s"}`);
  lines.push("");
  if (map.edges.length === 0) {
    lines.push("  no cross-domain import edges found");
  } else {
    for (const edge of map.edges) {
      lines.push(`  ${edge.from} -> ${edge.to}  (${edge.weight} import${edge.weight === 1 ? "" : "s"})`);
    }
  }
  lines.push("");

  if (narrative) {
    lines.push("SUMMARY");
    lines.push(`  ${narrative.summary}`);
    lines.push("");
    lines.push("NOTABLE CONCERNS");
    lines.push(
      narrative.notableConcerns.length ? narrative.notableConcerns.map((concern) => `  - ${concern}`).join("\n") : "  (none)",
    );
  } else {
    lines.push("SUMMARY");
    lines.push("  no ANTHROPIC_API_KEY set, so codeatlas only computed the real graph and skipped the narrative summary");
    lines.push("  set ANTHROPIC_API_KEY to get a plain language summary and notable structural concerns");
  }

  return lines.join("\n");
}

export function renderBlastRadius(radius: BlastRadius): string {
  if (!radius.exists) {
    return `"${radius.target}" isn't a file this scan knows about, nothing to trace.`;
  }

  if (radius.affectedFiles.length === 0) {
    return `WHAT BREAKS IF YOU DELETE ${radius.target}?\n\nnothing, as far as the real import graph can tell. no other file transitively imports it.`;
  }

  const lines: string[] = [];
  lines.push(`WHAT BREAKS IF YOU DELETE ${radius.target}?`);
  lines.push("");
  lines.push(`${radius.affectedFiles.length} file${radius.affectedFiles.length === 1 ? "" : "s"} across ${radius.affectedDomains.length} domain${radius.affectedDomains.length === 1 ? "" : "s"} transitively depend on it:`);
  lines.push("");
  lines.push(`AFFECTED DOMAINS`);
  for (const domain of radius.affectedDomains) lines.push(`  ${domain}`);
  lines.push("");
  lines.push(`AFFECTED FILES`);
  for (const file of radius.affectedFiles) lines.push(`  ${file}`);

  return lines.join("\n");
}
