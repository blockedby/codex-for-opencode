import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import plugin from "../plugin/index.ts";

async function load(directory) {
  const tools = new Map();
  const skills = new Map();
  await plugin.setup({
    location: { directory: "/not-the-session-workspace" },
    session: { get: async () => ({ location: { directory } }) },
    tool: { transform: async (fn) => fn({ add: (tool) => tools.set(tool.name, tool) }) },
    skill: { transform: async (fn) => fn({ add: (skill) => skills.set(skill.id, skill) }) }
  });
  return { tools, skills };
}

test("V2 default entrypoint registers all tools and the bundled skill", async () => {
  assert.equal(plugin.id, "codex-for-opencode");
  const { tools, skills } = await load(process.cwd());
  assert.deepEqual([...tools.keys()], ["web_search_codex", "web_fetch_codex", "apply_patch_codex", "codex_task"]);
  for (const tool of tools.values()) {
    assert.equal(tool.input.type, "object");
    assert.equal(tool.input.additionalProperties, false);
  }
  const skill = skills.get("codex-tools");
  assert.equal(skill.name, "codex-tools");
  assert.match(skill.description, /web_search_codex/);
  assert.match(skill.content, /# Codex Tools/);
  assert.equal(skill.content.startsWith("---"), false);
  assert.equal(await readFile(skill.path, "utf8").then((s) => s.includes(skill.content)), true);
});

test("all V2 tool executors return content and use the current session directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "codex-v2-tools-test-"));
  const oldPath = process.env.PATH;
  try {
    const executable = join(directory, "codex");
    await writeFile(executable, `#!${process.execPath}\n` + `
const args = process.argv.slice(2);
const prompt = args.at(-1);
if (prompt.includes('Query: "hang"')) setInterval(() => {}, 1000);
let response;
if (prompt.includes('"results"')) response = { results: [], summary: process.cwd() };
else if (prompt.includes('"url":"string"')) response = { url: "https://example.com", title: null, text: null, markdown: null, summary: process.cwd() };
else if (prompt.includes('"applied"')) response = { applied: false, dry_run: true, files_changed: [], summary: process.cwd(), diff: null, error: null };
else response = { success: true, summary: process.cwd(), files_changed: [], tests_run: [], diff: null, error: null, notes: [] };
console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify(response) } }));
`);
    await chmod(executable, 0o755);
    process.env.PATH = `${directory}:${oldPath}`;
    const git = spawnSync("git", ["init", "--quiet", directory]);
    assert.equal(git.status, 0);
    const { tools } = await load(directory);
    const signal = new AbortController().signal;
    const context = { sessionID: "test-session", signal };
    const inputs = {
      web_search_codex: { query: "example" },
      web_fetch_codex: { url: "https://example.com" },
      apply_patch_codex: { patch: "*** Begin Patch\n*** Add File: example.txt\n+example\n*** End Patch", dry_run: true },
      codex_task: { task: "Report the directory", sandbox: "read-only" }
    };
    for (const [name, input] of Object.entries(inputs)) {
      const result = await tools.get(name).execute(input, context);
      assert.equal(typeof result.content, "string");
      assert.equal(JSON.parse(result.content).summary, resolve(directory));
    }
    await assert.rejects(tools.get("web_search_codex").execute({ query: "" }, context));
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(tools.get("web_search_codex").execute({ query: "x" }, { ...context, signal: controller.signal }), { name: "AbortError" });
    const running = new AbortController();
    const cancel = setTimeout(() => running.abort(), 100);
    try {
      await assert.rejects(tools.get("web_search_codex").execute({ query: "hang" }, { ...context, signal: running.signal }), { name: "AbortError" });
    } finally {
      clearTimeout(cancel);
    }
  } finally {
    process.env.PATH = oldPath;
    await rm(directory, { recursive: true, force: true });
  }
});
