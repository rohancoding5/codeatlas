import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../config.js";

test("parseArgs parses a plain map command", () => {
  assert.deepEqual(parseArgs(["map"]), { command: "map", dir: ".", json: false });
});

test("parseArgs reads --dir and --json for map", () => {
  assert.deepEqual(parseArgs(["map", "--dir", "./src", "--json"]), { command: "map", dir: "./src", json: true });
});

test("parseArgs parses blast with a target path", () => {
  const command = parseArgs(["blast", "src/services/user-service.ts"]);
  assert.deepEqual(command, { command: "blast", target: "src/services/user-service.ts", dir: ".", json: false });
});

test("parseArgs works when flags come before the blast target", () => {
  const command = parseArgs(["blast", "--dir", "./src", "user-service.ts"]);
  assert.deepEqual(command, { command: "blast", target: "user-service.ts", dir: "./src", json: false });
});

test("parseArgs throws when blast has no target", () => {
  assert.throws(() => parseArgs(["blast", "--dir", "./src"]), /needs a file path/);
});

test("parseArgs throws on an unknown command", () => {
  assert.throws(() => parseArgs(["chart"]), /unknown command/);
});

test("parseArgs throws on an unknown flag", () => {
  assert.throws(() => parseArgs(["map", "--bogus"]), /unknown flag/);
});

test("parseArgs throws when a flag is missing its value", () => {
  assert.throws(() => parseArgs(["map", "--dir"]), /needs a value/);
});

test("parseArgs returns null and prints help for --help", () => {
  assert.equal(parseArgs(["--help"]), null);
});

test("parseArgs returns null and prints help for no args", () => {
  assert.equal(parseArgs([]), null);
});
