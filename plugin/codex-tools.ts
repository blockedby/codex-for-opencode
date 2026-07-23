import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { type Plugin, tool } from "@opencode-ai/plugin";

type Sandbox = "read-only" | "workspace-write" | "danger-full-access";
type ApprovalPolicy = "never" | "on-request" | "on-failure" | "untrusted";
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const DEFAULT_CODEX_MODEL = "gpt-5.6-luna";

export const CodexToolsPlugin: Plugin = async () => ({
  tool: {
    codex_task: tool({
      description:
        "Delegate a bounded task to an authenticated Codex CLI agent in the current directory. Set web_search to let Codex use its native live web_search tool.",
      args: {
        task: tool.schema.string().min(1).describe("Task to delegate to Codex."),
        web_search: tool.schema.boolean().optional().describe("Enable Codex's native live web_search tool. Default: false."),
        sandbox: tool.schema.enum(["read-only", "workspace-write", "danger-full-access"]).optional(),
        approval_policy: tool.schema.enum(["never", "on-request", "on-failure", "untrusted"]).optional(),
        model: tool.schema.string().optional().describe("Optional Codex model override."),
        timeout_seconds: tool.schema.number().optional().describe("Timeout in seconds. Default: 900.")
      },
      async execute(args, context) {
        const result = await runCodex(args.task, {
          cwd: resolve(context.directory),
          webSearch: args.web_search ?? false,
          sandbox: args.sandbox ?? "workspace-write",
          approvalPolicy: args.approval_policy ?? "never",
          model: args.model,
          timeoutMs: secondsToMs(args.timeout_seconds, 900_000)
        });

        if (result.exitCode === 0) return result.output;
        return `Codex exited with code ${result.exitCode}.\n\n${result.stderr || result.output}`.trim();
      }
    })
  }
});

async function runCodex(prompt: string, options: {
  cwd: string;
  webSearch: boolean;
  sandbox: Sandbox;
  approvalPolicy: ApprovalPolicy;
  model?: string;
  timeoutMs: number;
}): Promise<{ exitCode: number; output: string; stderr: string }> {
  const args: string[] = [];
  if (options.webSearch) args.push("--search");
  args.push("--model", options.model ?? DEFAULT_CODEX_MODEL);
  args.push(
    "--ask-for-approval", options.approvalPolicy,
    "--sandbox", options.sandbox,
    "exec", "--json", "--skip-git-repo-check", prompt
  );

  try {
    const child = spawn("codex", args, {
      cwd: options.cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });

    const exitCode = await new Promise<number>((resolvePromise, reject) => {
      const timeout = setTimeout(() => child.kill("SIGTERM"), options.timeoutMs);
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timeout);
        resolvePromise(code ?? -1);
      });
    });

    return { exitCode, output: extractFinalMessage(stdout), stderr: truncate(stderr, 4_000) };
  } catch (error) {
    return { exitCode: -1, output: "", stderr: error instanceof Error ? error.message : String(error) };
  }
}

function extractFinalMessage(stdout: string): string {
  const events = stdout
    .split(/\r?\n/)
    .map((line) => tryParseJson(line.trim()))
    .filter((value): value is JsonValue => value !== undefined);

  for (const event of events.reverse()) {
    const text = extractText(event);
    if (text) return text;
  }

  return stdout.trim();
}

function tryParseJson(text: string): JsonValue | undefined {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return undefined;
  }
}

function extractText(value: JsonValue): string | null {
  if (!isRecord(value)) return null;
  for (const key of ["text", "message", "content", "final", "output", "response"]) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key];
  }
  if (isRecord(value.item)) return extractText(value.item);
  return typeof value.delta === "string" && value.delta.trim() ? value.delta : null;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function secondsToMs(value: number | undefined, fallbackMs: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallbackMs;
  return Math.max(5, Math.min(1_800, Math.floor(value))) * 1_000;
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}\n...[truncated ${text.length - maxChars} chars]`;
}
