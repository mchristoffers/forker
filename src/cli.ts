#!/usr/bin/env node
import { parseArgs } from "node:util";
import { fork } from "./fork.js";

const USAGE = `usage: forker fork <owner/repo> [--dir <path>] [--source-branch <branch>]

Forks <owner/repo> with gh, clones it and adds a Makefile with
build, publish, update and service-* targets backed by forker/*.sh.

options:
  --dir            clone directory (default: repo name)
  --source-branch  upstream branch to follow releases on (default: upstream default branch)
  -h, --help       show this help`;

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      dir: { type: "string" },
      "source-branch": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  const [command, upstream] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return;
  }
  if (command !== "fork" || !upstream) {
    console.error(USAGE);
    process.exit(1);
  }

  fork({ upstream, dir: values.dir, sourceBranch: values["source-branch"] });
}

try {
  main();
} catch (err) {
  console.error(`forker: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
