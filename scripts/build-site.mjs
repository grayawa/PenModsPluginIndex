import fs from "node:fs/promises";
import path from "node:path";
import { rootDir } from "./lib/registry.mjs";

const sourceDir = path.join(rootDir, "site");
const outputDir = path.join(rootDir, "dist");

await fs.mkdir(outputDir, { recursive: true });
await Promise.all([
  fs.rm(path.join(outputDir, "index.html"), { force: true }),
  fs.rm(path.join(outputDir, "main.js"), { force: true }),
  fs.rm(path.join(outputDir, "styles.css"), { force: true })
]);
await fs.cp(sourceDir, outputDir, { recursive: true });

console.log("Copied static site into dist.");
