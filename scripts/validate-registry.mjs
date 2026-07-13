import { loadPlugins } from "./lib/registry.mjs";

const { plugins, errors } = await loadPlugins();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${plugins.length} plugin entries.`);

