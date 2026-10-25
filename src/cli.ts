#!/usr/bin/env node
import { resolve, relative } from "path";
import { parseArgs } from "./config.js";
import { collectFiles } from "./files/collect.js";
import { buildDependencyGraph } from "./dependencies.js";
import { buildDomainMap } from "./graph.js";
import { blastRadius } from "./blast.js";
import { narrate, isNarrationAvailable } from "./narrate.js";
import { renderMap, renderBlastRadius } from "./report.js";
import type { MapNarrative } from "./types.js";

async function runMap(command: Extract<ReturnType<typeof parseArgs>, { command: "map" }>): Promise<void> {
  const dir = resolve(command.dir);
  const files = await collectFiles(dir);
  if (files.length === 0) {
    console.error(`no source files found under ${dir}`);
    process.exitCode = 1;
    return;
  }

  const dependencyGraph = buildDependencyGraph(files);
  const map = buildDomainMap(files, dependencyGraph);

  let narrative: MapNarrative | null = null;
  if (isNarrationAvailable()) {
    try {
      narrative = await narrate(map);
    } catch (err) {
      console.error(`claude narration failed, falling back to the raw graph: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (command.json) {
    console.log(JSON.stringify({ map, narrative }, null, 2));
    return;
  }

  console.log(renderMap(map, narrative));
}

async function runBlast(command: Extract<ReturnType<typeof parseArgs>, { command: "blast" }>): Promise<void> {
  const dir = resolve(command.dir);
  const files = await collectFiles(dir);
  if (files.length === 0) {
    console.error(`no source files found under ${dir}`);
    process.exitCode = 1;
    return;
  }

  const dependencyGraph = buildDependencyGraph(files);
  const target = relative(dir, resolve(dir, command.target));
  const radius = blastRadius(dependencyGraph, target);

  if (command.json) {
    console.log(JSON.stringify(radius, null, 2));
    return;
  }

  console.log(renderBlastRadius(radius));
  if (!radius.exists) process.exitCode = 1;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let command: ReturnType<typeof parseArgs>;
  try {
    command = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }
  if (!command) return;

  if (command.command === "map") await runMap(command);
  else await runBlast(command);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
