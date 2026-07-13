# PenMods Plugin Index

Community-maintained plugin index for PenMods.

## Repository scope

This repository only contains the registry/index source and the static website.
The PenMods installer plugin lives in a separate repository:
https://github.com/grayawa/PenModsPluginInstaller

## How it works

- Developers submit a pull request to the `registry` branch with a plugin
  metadata file in `plugins/`.
- GitHub Actions validates all YAML entries against the registry schema.
- The build step aggregates plugin metadata into machine-readable JSON files.
- GitHub Pages serves a searchable static site from the generated output.

## Local development

```bash
npm install
npm run validate
npm run build
```

Generated artifacts:

- `dist/data/plugins.json`: complete registry payload
- `dist/data/index.json`: lightweight listing for the website
- `dist/data/stats.json`: aggregate stats

## Deployment model

This repository separates site code from registry data.

- `main` contains the static website, schema, and build scripts.
- `registry` contains the community-maintained `plugins/` metadata files.
- GitHub Actions checks out both branches and builds a static `dist/` output.
- GitHub Pages deploys the generated artifact directly from Actions.

This keeps plugin submissions away from website code while still deploying one
static site.

## Registry design

Each project is declared in its own YAML file under `plugins/` on the
`registry` branch. The canonical schema lives in `schema/plugin.schema.json` on
`main`.

Compatibility supports both version gates and capability declarations:

```yaml
compatibility:
  penmods: ">=1.3.0"
  capabilities:
    requires:
      - capability:editor.commands
    conflicts:
      - capability:runtime.legacy-hooks
    optional:
      - capability:network.fetch
```

Projects may also declare capabilities they provide to the ecosystem:

```yaml
provides:
  - capability:panel.git-tools
  - capability:export.markdown
```

Plugin-to-plugin relationships can be categorized too:

```yaml
dependencies:
  required:
    - id: penmods.core-ui
  optional:
    - id: penmods.theme-hooks
  peer:
    - id: penmods.git-core
  incompatible:
    - id: penmods.legacy-panel
```

Use `kind` for project type, `category` for one stable primary bucket, and `tags` for flexible discovery metadata.
When a real plugin package already has a native `metadata.json`, prefer using that package `id` as the registry `id`.
Closed-source or restricted-distribution projects can still be indexed. Use `source_available`, `visibility`, and `distribution` to describe how users obtain them.

## Contributing

See `CONTRIBUTING.md` and copy `templates/plugin.template.yaml` when submitting
a new plugin to the `registry` branch.
