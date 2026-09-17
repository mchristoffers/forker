import { execFileSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
    // Forks have issues disabled by default; update and build failures are reported as issues.
    run("gh", ["repo", "edit", forkRepo, "--enable-issues"]);
    // Builds, updates and releases run on GitHub Actions. The update workflow pushes merges that can
    // touch upstream workflow files, which GITHUB_TOKEN may not do, so it gets the gh token (workflow scope).
    const token = run("gh", ["auth", "token"]);
    run("gh", ["api", "-X", "PUT", `repos/${forkRepo}/actions/permissions`, "-F", "enabled=true", "-f", "allowed_actions=all"]);
    execFileSync("gh", ["secret", "set", "FORKER_TOKEN", "--repo", forkRepo], { input: token, stdio: ["pipe", "ignore", "inherit"] });
    console.log("writing forker layer");
    const layer = join(dir, "forker");
    const workflows = join(dir, ".github", "workflows");
    const workflowFiles = ["forker-build.yml", "forker-update.yml"];
    if (existsSync(layer))
        throw new Error(`${layer} already exists in the source repo`);
    for (const name of workflowFiles) {
        if (existsSync(join(workflows, name)))
            throw new Error(`${join(workflows, name)} already exists in the source repo`);
    }
    cpSync(join(TEMPLATES, "forker"), layer, { recursive: true });
    for (const name of ["update.sh", "workflows.sh"]) {
        chmodSync(join(layer, name), 0o755);
    }
    const config = readFileSync(join(layer, "config"), "utf8")
        .replaceAll("{{UPSTREAM}}", upstream)
        .replaceAll("{{FORK}}", forkRepo)
        .replaceAll("{{UPSTREAM_BRANCH}}", sourceBranch)
        .replaceAll("{{FORK_BRANCH}}", branch);
    writeFileSync(join(layer, "config"), config);
    mkdirSync(workflows, { recursive: true });
    cpSync(join(TEMPLATES, "workflows", "forker-build.yml"), join(workflows, "forker-build.yml"));
    // Spread forks over the day instead of all hitting the top of the hour.
    const cron = `${Math.floor(Math.random() * 60)} ${Math.floor(Math.random() * 24)} * * *`;
    writeFileSync(join(workflows, "forker-update.yml"), readFileSync(join(TEMPLATES, "workflows", "forker-update.yml"), "utf8").replaceAll("{{CRON}}", cron));
    // Upstream CI is turned off before the push can trigger it; forker-update.yml repeats this after each merge.
    run("bash", ["forker/workflows.sh", "disable-upstream"], { cwd: dir, inherit: true });
    run("git", ["add", "forker", ...workflowFiles.map((name) => join(".github", "workflows", name))], { cwd: dir });
    run("git", ["commit", "-m", "Add forker layer (build, update, release on GitHub Actions)"], { cwd: dir });
    run("git", ["push", "origin", `HEAD:${branch}`], { cwd: dir, inherit: true });
    console.log(`done: ${forkRepo} (follows ${upstream}@${sourceBranch}, merges into ${branch}, daily at ${cron} UTC)`);
    console.log(`next: write the build job in .github/workflows/forker-build.yml with the create-build skill`);
}
