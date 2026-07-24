import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDirectory = resolve(root, "skills");
const entries = await readdir(skillsDirectory, { withFileTypes: true });
const errors = [];
let checked = 0;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const skillFile = resolve(skillsDirectory, entry.name, "SKILL.md");
  let content;
  try {
    content = await readFile(skillFile, "utf8");
  } catch {
    errors.push(`${entry.name}: missing SKILL.md`);
    continue;
  }

  checked += 1;
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${entry.name}: missing YAML frontmatter`);
    continue;
  }

  const frontmatter = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/))
      .filter(Boolean)
      .map((line) => [line[1], line[2].trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2")])
  );

  if (!frontmatter.name) errors.push(`${entry.name}: frontmatter name is required`);
  if (frontmatter.name !== entry.name) errors.push(`${entry.name}: frontmatter name must match its directory`);
  if (frontmatter.name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) {
    errors.push(`${entry.name}: name must use lowercase alphanumeric words separated by single hyphens`);
  }
  if (!frontmatter.description) errors.push(`${entry.name}: frontmatter description is required`);
  if (frontmatter.description && frontmatter.description.length > 1024) {
    errors.push(`${entry.name}: description must not exceed 1024 characters`);
  }
}

if (checked === 0) errors.push("no skills found");

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${checked} skill${checked === 1 ? "" : "s"}.`);
}
