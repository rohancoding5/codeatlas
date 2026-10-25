import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MapNarrativeSchema } from "./schema.js";
import type { DomainMap, MapNarrative } from "./types.js";

const SYSTEM_PROMPT = `You are looking at a real, mechanically extracted map of a codebase: a list of domains (groups of files) with how many files each has, and the real import edges between domains with how many imports cross each edge.

Rules:
- summary is a couple sentences describing the architecture this graph actually shows, in plain language, the way an engineer would describe it to a new hire. Name the domains that look central (many incoming edges) versus peripheral (few or no edges), and describe the overall shape if one is evident (layered, hub and spoke, a few isolated islands), but only if the evidence actually shows it, don't force a pattern that isn't there.
- notableConcerns lists real structural observations worth flagging, like a domain with a very high number of incoming edges (a lot depends on it, changes there are risky), a cycle between two domains (they depend on each other, which can make them hard to change independently), or a domain totally disconnected from the rest (dead code, or missing edges the import scan couldn't resolve). Empty array if nothing stands out.
- Base everything on the actual domains and edges given. Don't invent domain names or relationships that aren't in the evidence.`;

function formatMap(map: DomainMap): string {
  const domains = map.domains.map((domain) => `- ${domain.name} (${domain.files.length} files)`).join("\n");
  const edges = map.edges.length
    ? map.edges.map((edge) => `- ${edge.from} -> ${edge.to} (${edge.weight} import${edge.weight === 1 ? "" : "s"})`).join("\n")
    : "(no cross-domain import edges found)";

  return `Domains:\n${domains}\n\nEdges (domain imports domain):\n${edges}`;
}

export async function narrate(map: DomainMap, clientOptions?: ConstructorParameters<typeof Anthropic>[0]): Promise<MapNarrative> {
  const client = new Anthropic(clientOptions);
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: formatMap(map) }],
    output_config: { format: zodOutputFormat(MapNarrativeSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("claude didn't return a map narrative in the expected shape");
  }

  return response.parsed_output;
}

export function isNarrationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
