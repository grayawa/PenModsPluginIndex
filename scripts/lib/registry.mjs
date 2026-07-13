import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const pluginsDir = path.join(rootDir, "plugins");
const schemaPath = path.join(rootDir, "schema", "plugin.schema.json");

function byId(a, b) {
  return a.id.localeCompare(b.id);
}

function normalizeList(values = []) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function normalizeDependencies(dependencies = {}) {
  const normalizeDependencyList = (items = []) =>
    [...items]
      .map((item) => ({
        ...item,
        capabilities: normalizeList(item.capabilities ?? [])
      }))
      .sort((left, right) => left.id.localeCompare(right.id));

  return {
    required: normalizeDependencyList(dependencies.required ?? []),
    optional: normalizeDependencyList(dependencies.optional ?? []),
    peer: normalizeDependencyList(dependencies.peer ?? []),
    incompatible: normalizeDependencyList(dependencies.incompatible ?? [])
  };
}

function normalizePlugin(plugin, sourceFile) {
  const capabilities = plugin.compatibility?.capabilities ?? {};

  return {
    ...plugin,
    tags: normalizeList(plugin.tags),
    provides: normalizeList(plugin.provides ?? []),
    screenshots: plugin.screenshots ?? [],
    dependencies: normalizeDependencies(plugin.dependencies),
    compatibility: plugin.compatibility
      ? {
          ...plugin.compatibility,
          capabilities: {
            requires: normalizeList(capabilities.requires ?? []),
            conflicts: normalizeList(capabilities.conflicts ?? []),
            optional: normalizeList(capabilities.optional ?? [])
          }
        }
      : undefined,
    source_file: sourceFile.replace(/\\/g, "/")
  };
}

function validateCapabilitySets(plugin) {
  const capabilities = plugin.compatibility?.capabilities;
  if (!capabilities) {
    return [];
  }

  const overlap = [];
  const pairs = [
    ["requires", "conflicts"],
    ["requires", "optional"],
    ["conflicts", "optional"]
  ];

  for (const [leftKey, rightKey] of pairs) {
    const left = new Set(capabilities[leftKey] ?? []);
    const right = new Set(capabilities[rightKey] ?? []);
    for (const capability of left) {
      if (right.has(capability)) {
        overlap.push(`capability "${capability}" appears in both ${leftKey} and ${rightKey}`);
      }
    }
  }

  return overlap;
}

function validateDependencySets(plugin) {
  const dependencies = plugin.dependencies;
  if (!dependencies) {
    return [];
  }

  const errors = [];
  const buckets = ["required", "optional", "peer", "incompatible"];
  const locationById = new Map();

  for (const bucket of buckets) {
    for (const dependency of dependencies[bucket] ?? []) {
      const current = locationById.get(dependency.id) ?? [];
      current.push(bucket);
      locationById.set(dependency.id, current);
    }
  }

  for (const [id, locations] of locationById.entries()) {
    const uniqueLocations = [...new Set(locations)];
    if (uniqueLocations.length > 1) {
      errors.push(`dependency "${id}" appears in multiple categories: ${uniqueLocations.join(", ")}`);
    }
  }

  return errors;
}

export async function loadSchema() {
  const raw = await fs.readFile(schemaPath, "utf8");
  return JSON.parse(raw);
}

export async function loadPlugins() {
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(ya?ml)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const schema = await loadSchema();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const plugins = [];
  const errors = [];
  const ids = new Set();

  for (const fileName of files) {
    const absolutePath = path.join(pluginsDir, fileName);
    const relativePath = path.relative(rootDir, absolutePath);
    let parsed;

    try {
      const source = await fs.readFile(absolutePath, "utf8");
      parsed = yaml.load(source);
    } catch (error) {
      errors.push(`${relativePath}: invalid YAML - ${error.message}`);
      continue;
    }

    if (!validate(parsed)) {
      const details = validate.errors
        .map((error) => `${error.instancePath || "/"} ${error.message}`)
        .join("; ");
      errors.push(`${relativePath}: schema validation failed - ${details}`);
      continue;
    }

    const plugin = normalizePlugin(parsed, relativePath);

    if (ids.has(plugin.id)) {
      errors.push(`${relativePath}: duplicate plugin id "${plugin.id}"`);
      continue;
    }
    ids.add(plugin.id);

    for (const capabilityError of validateCapabilitySets(plugin)) {
      errors.push(`${relativePath}: ${capabilityError}`);
    }
    for (const dependencyError of validateDependencySets(plugin)) {
      errors.push(`${relativePath}: ${dependencyError}`);
    }

    plugins.push(plugin);
  }

  return {
    plugins: plugins.sort(byId),
    errors
  };
}

export function buildOutputs(plugins) {
  const generatedAt = new Date().toISOString();
  const stats = {
    plugin_count: plugins.length,
    author_count: new Set(plugins.map((plugin) => plugin.author)).size,
    category_count: new Set(plugins.map((plugin) => plugin.category)).size,
    tag_count: new Set(plugins.flatMap((plugin) => plugin.tags)).size,
    capability_count: new Set(
      plugins.flatMap((plugin) => [
        ...(plugin.provides ?? []),
        ...(plugin.compatibility?.capabilities?.requires ?? []),
        ...(plugin.compatibility?.capabilities?.conflicts ?? []),
        ...(plugin.compatibility?.capabilities?.optional ?? []),
        ...(plugin.compatibility?.capability_history?.map((entry) => entry.capability) ?? [])
      ])
    ).size
  };

  return {
    pluginsJson: {
      schema_version: 1,
      generated_at: generatedAt,
      plugins
    },
    indexJson: {
      schema_version: 1,
      generated_at: generatedAt,
      plugins: plugins.map((plugin) => ({
        id: plugin.id,
        kind: plugin.kind,
        name: plugin.name,
        author: plugin.author,
        category: plugin.category,
        summary: plugin.summary,
        icon: plugin.icon,
        version: plugin.version,
        verified: plugin.verified ?? false,
        source_available: plugin.source_available ?? false,
        visibility: plugin.visibility ?? "public",
        distribution_type: plugin.distribution?.type ?? null,
        update_strategy: plugin.update?.strategy ?? null,
        update_target_path: plugin.update?.target_path ?? null,
        requires_restart: plugin.update?.requires_restart ?? false,
        tags: plugin.tags,
        penmods: plugin.compatibility?.penmods ?? null,
        requires: plugin.compatibility?.capabilities?.requires ?? [],
        provides: plugin.provides ?? [],
        dependency_counts: {
          required: plugin.dependencies?.required?.length ?? 0,
          optional: plugin.dependencies?.optional?.length ?? 0,
          peer: plugin.dependencies?.peer?.length ?? 0,
          incompatible: plugin.dependencies?.incompatible?.length ?? 0
        }
      }))
    },
    statsJson: {
      schema_version: 1,
      generated_at: generatedAt,
      ...stats
    }
  };
}

export { rootDir };
