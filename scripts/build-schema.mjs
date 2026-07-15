import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginSchema } from "./lib/schema-definition.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(rootDir, "schema", "plugin.schema.json");

const output = `${JSON.stringify(pluginSchema, null, 2)}\n`;
const checkMode = process.argv.includes("--check");

if (checkMode) {
  let existing = null;
  try {
    existing = await fs.readFile(schemaPath, "utf8");
  } catch {
    console.error("schema/plugin.schema.json is missing. Run `npm run build:schema`.");
    process.exit(1);
  }

  if (existing !== output) {
    console.error("schema/plugin.schema.json is out of sync with scripts/lib/schema-definition.mjs. Run `npm run build:schema`.");
    process.exit(1);
  }

  console.log("schema/plugin.schema.json is up to date.");
} else {
  await fs.mkdir(path.dirname(schemaPath), { recursive: true });
  await fs.writeFile(schemaPath, output, "utf8");
  console.log(`Generated ${path.relative(rootDir, schemaPath)}`);
}
