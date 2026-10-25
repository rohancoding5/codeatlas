import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDependencyGraph } from "../dependencies.js";
import { buildDomainMap } from "../graph.js";

test("buildDomainMap groups files and produces cross-domain edges", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/payments/charge.ts", content: "import { login } from '../auth/session.js';\nexport function pay() {}\n" },
    { path: "src/ui/button.ts", content: "import { pay } from '../payments/charge.js';\nimport { login } from '../auth/session.js';\n" },
  ];
  const dependencyGraph = buildDependencyGraph(files);
  const map = buildDomainMap(files, dependencyGraph);

  assert.deepEqual(
    map.domains.map((d) => d.name).sort(),
    ["auth", "payments", "ui"],
  );

  const uiToAuth = map.edges.find((edge) => edge.from === "ui" && edge.to === "auth");
  const uiToPayments = map.edges.find((edge) => edge.from === "ui" && edge.to === "payments");
  const paymentsToAuth = map.edges.find((edge) => edge.from === "payments" && edge.to === "auth");

  assert.ok(uiToAuth);
  assert.ok(uiToPayments);
  assert.ok(paymentsToAuth);
});

test("buildDomainMap excludes same-domain imports from the edge list", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/auth/token.ts", content: "import { login } from './session.js';\n" },
  ];
  const dependencyGraph = buildDependencyGraph(files);
  const map = buildDomainMap(files, dependencyGraph);
  assert.equal(map.edges.length, 0);
});

test("buildDomainMap weighs an edge by how many imports cross it", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/auth/token.ts", content: "export function refresh() {}\n" },
    {
      path: "src/ui/button.ts",
      content: "import { login } from '../auth/session.js';\nimport { refresh } from '../auth/token.js';\n",
    },
  ];
  const dependencyGraph = buildDependencyGraph(files);
  const map = buildDomainMap(files, dependencyGraph);
  const edge = map.edges.find((e) => e.from === "ui" && e.to === "auth");
  assert.equal(edge?.weight, 2);
});
