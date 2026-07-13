import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { rootDir } from "./lib/registry.mjs";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const distDir = path.join(rootDir, "dist");
const outputDir = path.join(rootDir, "visual-snapshots");
const port = Number(process.env.VISUAL_PORT ?? 4173);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" ? "cmd.exe" : command;
    const commandArgs = process.platform === "win32"
      ? ["/d", "/s", "/c", command, ...args]
      : args;
    const child = spawn(executable, commandArgs, {
      cwd: rootDir,
      env: {
        ...process.env,
        REGISTRY_PLUGINS_DIR: process.env.REGISTRY_PLUGINS_DIR ?? ".registry/plugins"
      },
      stdio: "inherit",
      ...options
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function serveStatic() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^([/\\])+/, "");
    const filePath = path.join(distDir, safePath);

    if (!filePath.startsWith(distDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const body = await fs.readFile(filePath);
      response.writeHead(200, { "Content-Type": contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function capture(page, name, options = {}) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? true });
  console.log(`Wrote ${path.relative(rootDir, filePath)}`);
}

await run("npm", ["run", "build"]);
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const server = await serveStatic();
const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true
});

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".plugin-card");
  await capture(page, "desktop");

  await page.evaluate(() => window.scrollTo(0, 260));
  await page.waitForTimeout(350);
  await capture(page, "desktop-scrolled", { fullPage: false });

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".plugin-card");
  await capture(page, "mobile");

  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.dataset.theme = "dark";
  });
  await page.waitForSelector(".plugin-card");
  await capture(page, "desktop-dark");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".plugin-card");
  await capture(page, "mobile-dark");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
