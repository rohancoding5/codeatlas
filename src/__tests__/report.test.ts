import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBlastRadius, renderMap } from "../report.js";
import type { BlastRadius, DomainMap, MapNarrative } from "../types.js";

function map(overrides: Partial<DomainMap> = {}): DomainMap {
  return {
    domains: [
      { name: "auth", files: ["src/auth/session.ts"] },
      { name: "ui", files: ["src/ui/button.ts"] },
    ],
    edges: [{ from: "ui", to: "auth", weight: 2 }],
    ...overrides,
  };
}

test("renderMap lists domains and edges", () => {
  const output = renderMap(map(), null);
  assert.match(output, /DOMAINS -- 2/);
  assert.match(output, /auth\s+\(1 file\)/);
  assert.match(output, /ui -> auth\s+\(2 imports\)/);
});

test("renderMap explains when no ANTHROPIC_API_KEY is set", () => {
  const output = renderMap(map(), null);
  assert.match(output, /ANTHROPIC_API_KEY/);
});

test("renderMap prints the narrative when present", () => {
  const narrative: MapNarrative = {
    summary: "a small layered app where ui depends on auth",
    notableConcerns: ["auth has no dependents outside ui, worth double checking that's intentional"],
  };
  const output = renderMap(map(), narrative);
  assert.match(output, /small layered app/);
  assert.match(output, /worth double checking/);
});

test("renderMap reports no edges cleanly", () => {
  const output = renderMap(map({ edges: [] }), null);
  assert.match(output, /no cross-domain import edges found/);
});

test("renderBlastRadius reports an unknown target", () => {
  const radius: BlastRadius = { target: "src/nope.ts", exists: false, affectedFiles: [], affectedDomains: [] };
  assert.match(renderBlastRadius(radius), /isn't a file this scan knows about/);
});

test("renderBlastRadius reports nothing breaks when there are no dependents", () => {
  const radius: BlastRadius = { target: "src/ui/button.ts", exists: true, affectedFiles: [], affectedDomains: [] };
  assert.match(renderBlastRadius(radius), /nothing, as far as the real import graph can tell/);
});

test("renderBlastRadius lists affected files and domains", () => {
  const radius: BlastRadius = {
    target: "src/auth/session.ts",
    exists: true,
    affectedFiles: ["src/payments/charge.ts", "src/ui/button.ts"],
    affectedDomains: ["payments", "ui"],
  };
  const output = renderBlastRadius(radius);
  assert.match(output, /2 files across 2 domains/);
  assert.match(output, /src\/payments\/charge\.ts/);
  assert.match(output, /src\/ui\/button\.ts/);
});
