import { execFileSync } from "node:child_process";
/** Run a command and return trimmed stdout. Throws on non-zero exit. */
export function run(cmd, args, opts = {}) {
    const out = execFileSync(cmd, args, {
        cwd: opts.cwd,
        encoding: "utf8",
        stdio: opts.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    return (out ?? "").trim();
}
/** Like run, but returns null instead of throwing. */
export function tryRun(cmd, args, opts = {}) {
    try {
        return run(cmd, args, opts);
    }
    catch {
        return null;
    }
}
