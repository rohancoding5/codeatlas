# codeatlas

Maps a repo by how its domains depend on each other rather than its folder tree, and traces what breaks if you delete a file.

```bash
codeatlas map
```

```
DOMAINS -- 3

  ui  (2 files)
  auth  (1 file)
  payments  (1 file)

DOMAIN GRAPH -- 3 edges

  payments -> auth  (1 import)
  ui -> auth  (1 import)
  ui -> payments  (1 import)

SUMMARY
  auth sits at the center, both payments and ui depend on it, while ui also
  goes through payments directly. nothing depends on ui, which tracks for a
  presentation layer.

NOTABLE CONCERNS
  - auth has two incoming edges and no outgoing ones, changes there ripple
    into both of the other domains
```

```bash
codeatlas blast src/auth/session.ts
```

```
WHAT BREAKS IF YOU DELETE src/auth/session.ts?

2 files across 2 domains transitively depend on it:

AFFECTED DOMAINS
  payments
  ui

AFFECTED FILES
  src/payments/charge.ts
  src/ui/button.ts
```

## Why this exists

A folder tree tells you how a repo is organized, not how it actually behaves. Two folders that sit far apart can be tightly coupled, and two files in the same directory can barely know about each other. This builds the real import graph, groups files into domains, and shows the edges between domains instead of the nesting between folders, which is the thing you actually want when you're trying to understand how a large codebase holds together, or when you're about to delete something and want to know what's actually downstream of it.

## Install

Not published to npm yet, so clone and run it directly:

```bash
git clone https://github.com/rohancoding5/codeatlas.git
cd codeatlas
npm install
npm run build
node dist/cli.js map
```

Set `ANTHROPIC_API_KEY` to get a plain language summary of the graph and any notable structural concerns. Without a key, `map` still computes and prints the real domain graph, it just skips the narrative.

## Usage

```bash
codeatlas map --dir ./src
```

Walks the repo, groups files into domains (the directory directly under `src`, `lib`, or `app` if there is one, otherwise the top level directory), builds the real import graph between every file, and rolls it up into domain-to-domain edges weighted by how many actual imports cross each one. Same-domain imports don't show up as edges, only the cross-cutting ones do, which is the part a folder tree never shows you.

```bash
codeatlas blast src/services/user-service.ts
```

Traces every file that transitively depends on the given file, a real reverse breadth first search over the import graph, not a guess. Answers "what breaks if I delete this" with an actual list of files and the domains they belong to, or tells you honestly that nothing does.

### Options

```
--dir <path>       repo directory to map (default: current directory)
--json             print machine-readable JSON instead of a report
--help             show this message
```

## How it works

Everything except the map's narrative summary is a deterministic graph computation with no LLM involved: a regex based import scan (handling both extensionless and NodeNext style `.js` specifiers that resolve back to their real `.ts` source), grouped into domains by directory convention, rolled up into weighted domain edges, and traced with a real breadth first search for blast radius, one that correctly stops at a cycle instead of looping the target back into its own result. The one optional step, a plain language summary of what the graph shows, is handed to Claude with structured output, and it's told explicitly to only describe patterns the evidence actually supports.

## Known limitations

Domain grouping is a directory convention, not a semantic understanding of the code, a flat repo with everything in one folder gets one domain no matter how logically separate the code is. The import graph only follows what it can statically resolve, dynamic imports built from a runtime string, or imports of packages the scan doesn't know how to locate on disk, won't appear as edges.

## Development

```bash
git clone https://github.com/rohancoding5/codeatlas.git
cd codeatlas
npm install
npm test
```

`npm test` builds the project and runs the full suite with Node's built-in test runner: unit tests for domain grouping, the import graph (including the NodeNext `.js` specifier case), the domain edge rollup, and blast radius tracing (including a real cycle between two files, to prove the target never ends up back in its own result), plus a wire-format test for the real Anthropic SDK's structured-output parsing against a local HTTP server standing in for the Messages API.

## License

MIT
