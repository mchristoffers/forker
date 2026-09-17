import { execFileSync } from "node:child_process";

export interface RunOptions {
  cwd?: string;
  /** Stream output to the terminal instead of capturing it. */
  inherit?: boolean;
}

/** Run a command and return trimmed stdout. Throws on non-zero exit. */
export function run(cmd: string, args: string[], opts: RunOptions = {}): string {
  const out = execFileSync(cmd, args, {
    cwd: opts.cwd,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  return (out ?? "").trim();
}

/** Like run, but returns null instead of throwing. */
export function tryRun(cmd: string, args: string[], opts: RunOptions = {}): string | null {
  try {
    return run(cmd, args, opts);
  } catch {
    return null;
  }
}
