import { test } from "node:test";
import assert from "node:assert/strict";
import { domainOf, groupIntoDomains } from "../domains.js";

test("domainOf uses the second segment under a src-like root", () => {
  assert.equal(domainOf("src/auth/session.ts"), "auth");
  assert.equal(domainOf("lib/payments/stripe.ts"), "payments");
});

test("domainOf uses the first segment when there is no src-like root", () => {
  assert.equal(domainOf("packages/auth/session.ts"), "packages");
});

test("domainOf uses root for a file with no directory", () => {
  assert.equal(domainOf("index.ts"), "root");
});

test("domainOf treats a bare src-like file as root", () => {
  assert.equal(domainOf("src/index.ts"), "src");
});

test("domainOf handles windows-style backslash separators", () => {
  assert.equal(domainOf("src\\auth\\session.ts"), "auth");
  assert.equal(domainOf("packages\\auth\\session.ts"), "packages");
  assert.equal(domainOf("index.ts"), "root");
});

test("groupIntoDomains groups files by domain and sorts by size", () => {
  const domains = groupIntoDomains([
    { path: "src/auth/session.ts", content: "" },
    { path: "src/auth/login.ts", content: "" },
    { path: "src/payments/stripe.ts", content: "" },
    { path: "index.ts", content: "" },
  ]);

  assert.equal(domains.length, 3);
  assert.equal(domains[0].name, "auth");
  assert.equal(domains[0].files.length, 2);
  assert.deepEqual(domains[0].files, ["src/auth/login.ts", "src/auth/session.ts"]);
});

test("groupIntoDomains breaks ties alphabetically", () => {
  const domains = groupIntoDomains([
    { path: "src/payments/stripe.ts", content: "" },
    { path: "src/auth/session.ts", content: "" },
  ]);
  assert.deepEqual(domains.map((d) => d.name), ["auth", "payments"]);
});
