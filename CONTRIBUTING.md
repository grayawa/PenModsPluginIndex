# Contributing to PenMods Plugin Index

## Add a project

1. Copy `templates/plugin.template.yaml`.
2. Fill in the metadata fields.
3. Save it as `plugins/<plugin-id>.yaml`.
4. Open a pull request targeting the `registry` branch.

## Rules

- `id` must be globally unique and stable. If the plugin package already has a native `metadata.json`, use its `id` here too.
- `kind` should be `core` for PenMods itself or `plugin` for add-ons.
- `download_url` should point to a real downloadable artifact or release asset.
- `icon` should be a stable image URL.
- `category` should be the best primary bucket for the plugin.
- `tags` should use lowercase dot or dash separated names.
- `provides` and compatibility declarations should use `capability:<name>` values.
- `visibility: restricted` can be used for Telegram group or other gated distribution.
- `distribution` should describe where users actually obtain the project.
- Keep `summary` concise. Use `description` for longer details.

## Capability declaration guidance

Use capability declarations to describe host capabilities instead of encoding every detail into version numbers.

```yaml
compatibility:
  penmods: ">=1.2.0"
  capabilities:
    requires:
      - capability:ui.panel
      - capability:editor.commands
    conflicts:
      - capability:runtime.legacy-hooks
    optional:
      - capability:network.fetch
```

If your project exposes reusable capabilities, list them in `provides`.

## Closed-source or Telegram-distributed projects

Projects distributed through Telegram or other gated channels are still valid entries.

```yaml
source_available: false
visibility: restricted
distribution:
  type: telegram
  url: https://t.me/example_group
  notes: Join the Telegram group to access release files.
```

## Dependency categories

Use dependency categories to describe plugin-to-plugin relationships clearly.

```yaml
dependencies:
  required:
    - id: penmods.core-ui
      version: ">=1.0.0"
  optional:
    - id: penmods.theme-hooks
  peer:
    - id: penmods.git-core
      capabilities:
        - capability:api.repo-status
  incompatible:
    - id: penmods.legacy-panel
```

Suggested meaning:

- `required`: this plugin cannot work without the dependency
- `optional`: adds enhancements when present
- `peer`: integration target that is not strictly needed for base behavior
- `incompatible`: cannot be installed or enabled together

## Validation

Every pull request to `registry` is automatically validated. Common failures:

- invalid YAML syntax
- missing required fields
- duplicated plugin `id`
- malformed URLs
- conflicting capability declarations
