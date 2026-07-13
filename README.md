# PenMods Plugin Index Registry

This branch stores community-maintained plugin metadata for PenMods Plugin Index.

Website source, schema validation code, and GitHub Pages deployment live on the
`main` branch. Pull requests that add or update plugins should target this
`registry` branch.

## Add or Update a Plugin

1. Copy `templates/plugin.template.yaml`.
2. Fill in the metadata fields.
3. Save it as `plugins/<plugin-id>.yaml`.
4. Open a pull request targeting `registry`.

Each YAML file is validated by GitHub Actions using the schema and scripts from
`main`.

## Files Kept Here

- `plugins/`: plugin metadata entries.
- `templates/`: copyable metadata templates.
- `CONTRIBUTING.md`: contribution rules for registry entries.

Do not add website code, generated JSON, build output, or deployment files to
this branch.
