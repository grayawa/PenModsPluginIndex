import fs from "node:fs/promises";
import path from "node:path";
import { buildOutputs, loadPlugins, rootDir } from "./lib/registry.mjs";

const outputDir = path.join(rootDir, "dist", "data");
const { plugins, errors } = await loadPlugins();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const { pluginsJson, indexJson, statsJson } = buildOutputs(plugins);

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(outputDir, "plugins.json"), JSON.stringify(pluginsJson, null, 2) + "\n"),
  fs.writeFile(path.join(outputDir, "index.json"), JSON.stringify(indexJson, null, 2) + "\n"),
  fs.writeFile(path.join(outputDir, "stats.json"), JSON.stringify(statsJson, null, 2) + "\n")
]);

console.log(`Built registry output for ${plugins.length} plugins.`);
