import { chmodSync, cpSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run, tryRun } from "./exec.js";
const TEMPLATES = fileURLToPath(new URL("../templates", import.meta.url));
/** Parse "owner/repo" out of a GitHub https or ssh remote URL. */
function repoFromUrl(url) {
    const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?\/?$/);
    if (!m)
        throw new Error(`cannot parse GitHub repo from remote URL: ${url}`);
    return m[1];
}
export function fork(opts) {
    const { upstream } = opts;
    if (!/^[\w.-]+\/[\w.-]+$/.test(upstream)) {
        throw new Error(`expected owner/repo, got: ${upstream}`);
    }
    if (tryRun("gh", ["auth", "status"]) === null) {
        throw new Error("gh is not authenticated, run: gh auth login");
    }
    const branch = run("gh", ["repo", "view", upstream, "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
    const sourceBranch = opts.sourceBranch ?? branch;
    if (tryRun("gh", ["api", `repos/${upstream}/branches/${encodeURIComponent(sourceBranch)}`, "--silent"]) === null) {
        throw new Error(`source branch not found on ${upstream}: ${sourceBranch}`);
    }
    const dir = resolve(opts.dir ?? upstream.split("/")[1]);
    if (existsSync(dir))
        throw new Error(`target directory already exists: ${dir}`);
    console.log(`forking ${upstream} into ${dir}`);
    run("gh", ["repo", "fork", upstream, "--clone", "--", dir], { inherit: true });
    if (tryRun("git", ["remote", "get-url", "upstream"], { cwd: dir }) === null) {
        run("git", ["remote", "add", "upstream", `https://github.com/${upstream}.git`], { cwd: dir });
    }
    const forkRepo = repoFromUrl(run("git", ["remote", "get-url", "origin"], { cwd: dir }));
    // Forks have issues disabled by default; update.sh needs them for conflict reports.
    run("gh", ["repo", "edit", forkRepo, "--enable-issues"]);
    console.log("writing forker layer");
    const layer = join(dir, "forker");
    if (existsSync(layer))
        throw new Error(`${layer} already exists in the source repo`);
    cpSync(join(TEMPLATES, "forker"), layer, { recursive: true });
    renameSync(join(layer, "gitignore"), join(layer, ".gitignore"));
    for (const name of ["build.sh", "publish.sh", "update.sh", "service.sh"]) {
        chmodSync(join(layer, name), 0o755);
    }
    const config = readFileSync(join(layer, "config"), "utf8")
        .replaceAll("{{UPSTREAM}}", upstream)
        .replaceAll("{{FORK}}", forkRepo)
        .replaceAll("{{UPSTREAM_BRANCH}}", sourceBranch)
        .replaceAll("{{FORK_BRANCH}}", branch);
    writeFileSync(join(layer, "config"), config);
    // Never clobber an upstream Makefile; fall back to forker.mk (make -f forker.mk ...).
    const makefile = existsSync(join(dir, "Makefile")) ? "forker.mk" : "Makefile";
    cpSync(join(TEMPLATES, "Makefile"), join(dir, makefile));
    run("git", ["add", makefile, "forker"], { cwd: dir });
    run("git", ["commit", "-m", "Add forker layer (build, publish, update)"], { cwd: dir });
    run("git", ["push", "origin", `HEAD:${branch}`], { cwd: dir, inherit: true });
    const make = makefile === "Makefile" ? "make" : "make -f forker.mk";
    console.log(`done: ${forkRepo} (follows ${upstream}@${sourceBranch}, merges into ${branch})`);
    console.log(`make: ${make} build | publish VERSION=vX | update | service-install`);
    console.log(`next: generate forker/build.sh with the create-or-repair-build skill`);
}
