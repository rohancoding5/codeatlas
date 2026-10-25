import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDependencyGraph, dependentsOf, extractImports } from "../dependencies.js";

test("extractImports finds js import specifiers", () => {
  const specifiers = extractImports("import { foo } from './foo.js';\nimport bar from '../bar.js';\n", "js");
  assert.deepEqual(specifiers.sort(), ["../bar.js", "./foo.js"]);
});

test("extractImports finds python import specifiers", () => {
  const specifiers = extractImports("from pkg.mod import thing\nimport pkg.other\n", "python");
  assert.deepEqual(specifiers.sort(), ["pkg.mod", "pkg.other"]);
});

test("buildDependencyGraph resolves an extensionless relative import", () => {
  const files = [
    { path: "src/payments/stripe.ts", content: "export function charge() {}\n" },
    { path: "src/payments/service.ts", content: "import { charge } from './stripe';\n" },
  ];
  const graph = buildDependencyGraph(files);
  assert.deepEqual([...(graph.get("src/payments/service.ts") ?? [])], ["src/payments/stripe.ts"]);
});

test("buildDependencyGraph resolves a NodeNext style .js specifier to its .ts source", () => {
  const files = [
    { path: "src/payments/stripe.ts", content: "export function charge() {}\n" },
    { path: "src/payments/service.ts", content: "import { charge } from './stripe.js';\n" },
  ];
  const graph = buildDependencyGraph(files);
  assert.deepEqual([...(graph.get("src/payments/service.ts") ?? [])], ["src/payments/stripe.ts"]);
});

test("dependentsOf finds every file that imports a given path", () => {
  const files = [
    { path: "src/auth/session.ts", content: "export function login() {}\n" },
    { path: "src/ui/header.ts", content: "import { login } from '../auth/session.js';\n" },
  ];
  const graph = buildDependencyGraph(files);
  assert.deepEqual(dependentsOf(graph, "src/auth/session.ts"), ["src/ui/header.ts"]);
});
