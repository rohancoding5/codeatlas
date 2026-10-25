export type Command =
  | { command: "map"; dir: string; json: boolean }
  | { command: "blast"; target: string; dir: string; json: boolean };

function printHelp(): void {
  console.log(`codeatlas map [options]
codeatlas blast <path> [options]

maps a repo by real domain relationships instead of its folder tree, and
traces what actually breaks if you delete a file.

  map                   group files into domains and print the real import
                        graph between them
  blast <path>          trace every file that transitively depends on this
                        one, the real blast radius if you deleted it
  --dir <path>          repo directory to map (default: current directory)
  --json                print machine-readable JSON instead of a report
  --help                show this message

examples:
  codeatlas map --dir ./src
  codeatlas blast src/services/user-service.ts
`);
}

export function parseArgs(argv: string[]): Command | null {
  if (argv.length === 0 || argv.includes("--help")) {
    printHelp();
    return null;
  }

  const [first, ...rest] = argv;
  let dir = ".";
  let json = false;

  function next(flag: string, i: number, list: string[]): string {
    const value = list[i + 1];
    if (value === undefined) throw new Error(`${flag} needs a value`);
    return value;
  }

  if (first === "map") {
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--dir") {
        dir = next(arg, i, rest);
        i += 1;
      } else if (arg === "--json") {
        json = true;
      } else if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      }
    }
    return { command: "map", dir, json };
  }

  if (first === "blast") {
    let target: string | undefined;
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--dir") {
        dir = next(arg, i, rest);
        i += 1;
      } else if (arg === "--json") {
        json = true;
      } else if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      } else if (target === undefined) {
        target = arg;
      }
    }
    if (!target) throw new Error("blast needs a file path to trace");
    return { command: "blast", target, dir, json };
  }

  throw new Error(`unknown command "${first}", use "map" or "blast"`);
}
