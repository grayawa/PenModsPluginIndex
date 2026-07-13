# PenMods Plugin Index Registry

这里是 PenMods Plugin Index 的插件元数据分支。

网站源码、校验脚本、JSON 生成逻辑和 GitHub Pages 部署都在 `main` 分支；这个 `registry` 分支只保存社区提交的插件列表数据。

## 添加插件流程

1. Fork 本仓库。
2. Fork 时请保留全部分支，至少需要包含 `registry` 分支。
3. 在你 fork 后的仓库中切换到 `registry` 分支。
4. 在 `plugins/` 文件夹下新建一个 YAML 文件，文件名格式为 `<插件id>.yaml`。
5. 参考 `templates/plugin.template.yaml` 填写插件信息。
6. 使用 `add <插件名称> <插件id>` 作为提交说明并提交。
7. 推送到你 fork 的仓库。
8. 向本仓库的 `registry` 分支发起 Pull Request。
9. 我看到后会审核，通过后合并。

提交说明示例：

```text
add 插件安装器 com.penmods.plugininstaller
```

文件路径示例：

```text
plugins/com.penmods.plugininstaller.yaml
```

## 插件 ID 要求

- `id` 必须全局唯一，并且合并后尽量不要再改。
- 如果插件包本身已经有原生 `metadata.json`，请优先使用里面已有的插件 `id`。
- 推荐使用反向域名或类似命名方式，例如 `com.example.plugin`。
- 只能使用小写字母、数字、点号和短横线。
- YAML 文件名必须和插件 ID 对应，例如 `id: com.example.plugin` 对应 `plugins/com.example.plugin.yaml`。

## 必填信息

每个插件至少应该说明这些内容：

- `id`: 插件唯一 ID。
- `kind`: 项目类型，普通插件写 `plugin`，PenMods 本体这类核心项目写 `core`。
- `name`: 插件显示名称。
- `author`: 作者或维护者。
- `category`: 主分类。
- `summary`: 一句话简介。
- `repo_url`: 项目地址。如果没有开源仓库，请填写主要说明页面或获取页面。
- `download_url`: 下载地址、发布页或获取入口。
- `version`: 当前版本号。
- `tags`: 搜索用标签。

## 可选但推荐的信息

- `description`: 更详细的介绍。
- `icon`: 图标地址。如果插件没有真实图标，可以省略，不要随便填一个无关图标。
- `homepage`: 主页。
- `releases_url`: 发布页。
- `license`: 许可证。
- `screenshots`: 截图 URL 列表。
- `verified`: 是否已经人工确认可用。

## 分类和标签

`category` 是插件的主分类，只能选一个。当前推荐值包括：

- `core`
- `appearance`
- `developer-tools`
- `editor`
- `integration`
- `productivity`
- `system`
- `utility`
- `other`

`tags` 可以写多个，用于搜索和补充说明。标签应尽量简短、稳定、全小写，例如：

```yaml
tags:
  - installer
  - registry
  - utility
```

## 兼容性和能力声明

PenMods 并不是一开始就有完整插件系统，所以不要只依赖版本号表达兼容性。推荐使用 `capability:<name>` 声明插件需要或提供的能力。

插件需要的能力写在：

```yaml
compatibility:
  capabilities:
    requires:
      - capability:plugin-loader
    optional:
      - capability:settings
    conflicts:
      - capability:runtime.legacy-hooks
```

插件自己提供的能力写在：

```yaml
provides:
  - capability:plugin.install
  - capability:plugin.registry-client
```

如果确实需要声明最低 PenMods 版本，可以额外填写：

```yaml
compatibility:
  penmods: ">=1.2.0"
```

## 依赖关系

插件之间的关系可以写在 `dependencies` 里：

```yaml
dependencies:
  required:
    - id: lyrecoul.penmods
      capabilities:
        - capability:plugin-loader
      reason: Requires the PenMods plugin loading environment.
  optional:
    - id: penmods.theme-hooks
  peer:
    - id: penmods.git-core
  incompatible:
    - id: penmods.legacy-panel
```

含义：

- `required`: 必须安装，否则插件不能正常工作。
- `optional`: 可选依赖，存在时提供增强功能。
- `peer`: 可协作插件，不是基础运行必需。
- `incompatible`: 不能同时安装或启用。

## 闭源或 Telegram 分发插件

插件不一定必须开源。闭源插件、Telegram 群分发插件也可以提交，但必须明确标注。

示例：

```yaml
source_available: false
visibility: restricted
distribution:
  type: telegram
  url: https://t.me/example_group
  notes: Join the Telegram group to access release files.
```

如果没有源码，请不要把 `source_available` 写成 `true`。

## 审核要求

Pull Request 至少需要满足：

- YAML 语法正确。
- 插件 ID 没有重复。
- 文件名和插件 ID 对应。
- URL 能说明插件来源或获取方式。
- 简介没有明显误导。
- 能力、依赖、分发方式填写合理。
- 不包含恶意、钓鱼或明显不可用的内容。

自动校验会使用 `main` 分支里的 schema 和脚本。这个分支不应该添加网站源码、生成后的 JSON、构建输出或部署配置。
