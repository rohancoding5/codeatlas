import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDependencyGraph } from "../dependencies.js";
import { blastRadius } from "../blast.js";

test("blastRadius traces the full transitive chain of dependents", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/payments/charge.ts", content: "import { login } from '../auth/session.js';\nexport function pay() {}\n" },
    { path: "src/ui/button.ts", content: "import { pay } from '../payments/charge.js';\n" },
  ];
  const graph = buildDependencyGraph(files);
  const radius = blastRadius(graph, "src/auth/session.ts");

  assert.equal(radius.exists, true);
  assert.deepEqual(radius.affectedFiles.sort(), ["src/payments/charge.ts", "src/ui/button.ts"]);
  assert.deepEqual(radius.affectedDomains.sort(), ["payments", "ui"]);
});

test("blastRadius returns an empty list for a leaf file nothing depends on", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/ui/button.ts", content: "export function render() {}\n" },
  ];
  const graph = buildDependencyGraph(files);
  const radius = blastRadius(graph, "src/ui/button.ts");
  assert.equal(radius.exists, true);
  assert.deepEqual(radius.affectedFiles, []);
});

test("blastRadius reports exists false for a file not in the graph", () => {
  const files = [{ path: "src/auth/session.ts", content: "export function login() {}\n" }];
  const graph = buildDependencyGraph(files);
  const radius = blastRadius(graph, "src/nope.ts");
  assert.equal(radius.exists, false);
  assert.deepEqual(radius.affectedFiles, []);
});

test("blastRadius does not get stuck in a cycle between two files", () => {
  const files = [
    { path: "src/a.ts", content: "import './b.js';\n" },
    { path: "src/b.ts", content: "import './a.js';\n" },
    { path: "src/c.ts", content: "import './a.js';\n" },
  ];
  const graph = buildDependencyGraph(files);
  const radius = blastRadius(graph, "src/a.ts");
  assert.deepEqual(radius.affectedFiles.sort(), ["src/b.ts", "src/c.ts"]);
});
