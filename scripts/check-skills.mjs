import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

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

  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length > 0) {
    for (const error of document.errors) errors.push(`${entry.name}: invalid YAML: ${error.message}`);
    continue;
  }

  const frontmatter = document.toJS();
  if (!isRecord(frontmatter)) {
    errors.push(`${entry.name}: frontmatter must be a YAML mapping`);
    continue;
  }

  const name = frontmatter.name;
  const description = frontmatter.description;
  if (typeof name !== "string" || name.length === 0) {
    errors.push(`${entry.name}: frontmatter name is required and must be a string`);
  } else {
    if (name !== entry.name) errors.push(`${entry.name}: frontmatter name must match its directory`);
    if (name.length > 64) errors.push(`${entry.name}: name must not exceed 64 characters`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      errors.push(`${entry.name}: name must use lowercase alphanumeric words separated by single hyphens`);
    }
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    errors.push(`${entry.name}: frontmatter description is required and must be a non-empty string`);
  } else if (description.length > 1024) {
    errors.push(`${entry.name}: description must not exceed 1024 characters`);
  }

  for (const field of ["license", "compatibility"]) {
    if (frontmatter[field] !== undefined && typeof frontmatter[field] !== "string") {
      errors.push(`${entry.name}: ${field} must be a string`);
    }
  }
  if (typeof frontmatter.compatibility === "string") {
    if (frontmatter.compatibility.trim().length === 0) {
      errors.push(`${entry.name}: compatibility must not be empty`);
    } else if (frontmatter.compatibility.length > 500) {
      errors.push(`${entry.name}: compatibility must not exceed 500 characters`);
    }
  }

  if (frontmatter.metadata !== undefined) {
    if (!isRecord(frontmatter.metadata)) {
      errors.push(`${entry.name}: metadata must be a string-to-string mapping`);
    } else if (Object.values(frontmatter.metadata).some((value) => typeof value !== "string")) {
      errors.push(`${entry.name}: every metadata value must be a string`);
    }
  }
}

if (checked === 0) errors.push("no skills found");

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${checked} skill${checked === 1 ? "" : "s"}.`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
