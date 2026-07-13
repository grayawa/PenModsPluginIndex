const state = {
  fullPlugins: [],
  listPlugins: [],
  filteredPlugins: [],
  selectedTags: new Set(),
  selectedId: null
};

const categoryLabels = {
  core: "核心",
  appearance: "外观",
  "developer-tools": "开发工具",
  editor: "编辑器",
  integration: "集成",
  productivity: "效率",
  system: "系统",
  utility: "工具",
  other: "其他"
};

const distributionLabels = {
  direct: "直接下载",
  "github-release": "GitHub Releases",
  telegram: "Telegram 分发",
  website: "网站分发",
  other: "其他渠道"
};

const elements = {
  hero: document.querySelector("#hero"),
  stats: document.querySelector("#stats"),
  themeToggle: document.querySelector("#themeToggle"),
  themeToggleIcon: document.querySelector("#themeToggleIcon"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  tagFilter: document.querySelector("#tagFilter"),
  pluginList: document.querySelector("#pluginList"),
  pluginDetail: document.querySelector("#pluginDetail"),
  pluginCardTemplate: document.querySelector("#pluginCardTemplate")
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getCategoryLabel(category) {
  return categoryLabels[category] ?? category;
}

function getDistributionLabel(type) {
  return distributionLabels[type] ?? type;
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function updateThemeToggle() {
  const theme = currentTheme();
  const nextThemeLabel = theme === "dark" ? "亮色" : "暗色";
  const iconName = theme === "dark" ? "sun" : "moon";
  const iconColor = theme === "dark" ? "%23f4f4f4" : "%23161616";
  elements.themeToggleIcon.src = `https://api.iconify.design/lucide:${iconName}.svg?color=${iconColor}`;
  elements.themeToggle.setAttribute("aria-label", `切换到${theme === "dark" ? "亮色" : "暗色"}模式`);
  elements.themeToggle.title = `切换到${nextThemeLabel}模式`;
}

function toggleTheme() {
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
  updateThemeToggle();
}

function renderStats(stats) {
  elements.stats.innerHTML = `<span class="stat-count">${escapeHtml(String(stats.plugin_count))}</span><span>plugins indexed</span>`;
}

function buildTagOptions() {
  const tags = [...new Set(state.listPlugins.flatMap((plugin) => plugin.tags))].sort((a, b) =>
    a.localeCompare(b)
  );

  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-option";
    button.textContent = tag;
    button.dataset.tag = tag;
    button.addEventListener("click", () => {
      if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
      } else {
        state.selectedTags.add(tag);
      }
      button.classList.toggle("is-selected", state.selectedTags.has(tag));
      filterPlugins();
    });
    elements.tagFilter.append(button);
  }
}

function buildCategoryOptions() {
  const categories = [...new Set(state.listPlugins.map((plugin) => plugin.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = getCategoryLabel(category);
    elements.categoryFilter.append(option);
  }
}

function matchesQuery(plugin, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    plugin.id,
    plugin.name,
    plugin.author,
    plugin.summary,
    ...(plugin.tags ?? []),
    ...(plugin.requires ?? []),
    ...(plugin.provides ?? [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function filterPlugins() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;
  const tags = [...state.selectedTags];

  state.filteredPlugins = state.listPlugins.filter((plugin) => {
    const categoryMatch = !category || plugin.category === category;
    const tagMatch = tags.length === 0 || tags.every((tag) => plugin.tags.includes(tag));
    return categoryMatch && tagMatch && matchesQuery(plugin, query);
  });

  renderPluginList();

  const selectedStillVisible = state.filteredPlugins.some((plugin) => plugin.id === state.selectedId);
  if (!selectedStillVisible) {
    state.selectedId = state.filteredPlugins[0]?.id ?? null;
  }
  renderPluginDetail();
}

function renderPluginList() {
  elements.pluginList.innerHTML = "";

  if (state.filteredPlugins.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有匹配当前筛选条件的插件。";
    elements.pluginList.append(empty);
    return;
  }

  for (const plugin of state.filteredPlugins) {
    const fragment = elements.pluginCardTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".plugin-card");
    const title = fragment.querySelector("h2");
    const icon = fragment.querySelector(".plugin-card-icon");
    const version = fragment.querySelector(".version");
    const summary = fragment.querySelector(".plugin-card-summary");
    const meta = fragment.querySelector(".plugin-card-meta");
    const tagRow = fragment.querySelector(".tag-row");

    title.textContent = plugin.name;
    renderIcon(icon, plugin);
    version.textContent = plugin.version;
    summary.textContent = plugin.summary;
    meta.textContent = `${plugin.author} · ${plugin.penmods ? `PenMods ${plugin.penmods}` : "未声明版本门槛"}`;
    article.dataset.pluginId = plugin.id;

    if (plugin.id === state.selectedId) {
      article.classList.add("is-active");
    }

    for (const item of plugin.tags.slice(0, 4)) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = item;
      tagRow.append(chip);
    }

    if (plugin.verified) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = "已验证";
      tagRow.append(chip);
    }

    if (plugin.visibility === "restricted") {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = "受限获取";
      tagRow.append(chip);
    }

    const categoryChip = document.createElement("span");
    categoryChip.className = "chip";
    categoryChip.textContent = getCategoryLabel(plugin.category);
    tagRow.prepend(categoryChip);

    article.addEventListener("click", () => {
      state.selectedId = plugin.id;
      window.location.hash = plugin.id;
      renderPluginList();
      renderPluginDetail();
    });

    elements.pluginList.append(fragment);
  }
}

function renderIcon(element, plugin) {
  if (plugin.icon) {
    element.src = plugin.icon;
    element.alt = `${plugin.name} icon`;
    element.hidden = false;
    return;
  }

  const placeholder = document.createElement("div");
  placeholder.className = element.className;
  placeholder.classList.add("icon-placeholder");
  placeholder.textContent = plugin.name.slice(0, 2);
  element.replaceWith(placeholder);
}

function formatPenModsCompatibility(value) {
  return value ? `PenMods ${value}` : "未声明 PenMods 版本门槛";
}

function formatVersion(version) {
  return version.startsWith("v") ? version : `v${version}`;
}

function renderCapabilityGroup(title, capabilities) {
  if (!capabilities || capabilities.length === 0) {
    return "";
  }

  return `
    <section class="detail-feature-group">
      <h4>${escapeHtml(title)}</h4>
      <div class="detail-tags">
        ${capabilities.map((capability) => `<span class="chip">${escapeHtml(capability)}</span>`).join("")}
      </div>
    </section>
  `;
}

function renderDependencyGroup(title, dependencies) {
  if (!dependencies || dependencies.length === 0) {
    return "";
  }

  return `
    <section class="detail-feature-group">
      <h4>${escapeHtml(title)}</h4>
      <div class="detail-tags">
        ${dependencies
          .map((dependency) => {
            const extras = [dependency.version, ...(dependency.capabilities ?? [])].filter(Boolean).join(" · ");
            const label = extras ? `${dependency.id} (${extras})` : dependency.id;
            return `<span class="chip">${escapeHtml(label)}</span>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCapabilityHistory(history) {
  if (!history || history.length === 0) {
    return "";
  }

  const entries = [...history].sort((left, right) => left.capability.localeCompare(right.capability));

  return `
    <section class="detail-section">
      <h3>能力版本</h3>
      <div class="capability-history">
        ${entries
          .map(
            (entry) => {
              const versionLabel = entry.since_ci_version
                ? `${entry.since_version} · CI ${entry.since_ci_version}`
                : entry.since_version;

              return `
                <article class="history-card">
                  <strong>${escapeHtml(entry.capability)}</strong>
                  <span>自 ${escapeHtml(versionLabel)} 起</span>
                  ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
                </article>
              `;
            }
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPluginDetail() {
  const plugin = state.fullPlugins.find((entry) => entry.id === state.selectedId);

  if (!plugin) {
    elements.pluginDetail.innerHTML = `
      <div class="detail-empty">
        <p>选择一个插件以查看完整元数据。</p>
      </div>
    `;
    return;
  }

  const capabilities = plugin.compatibility?.capabilities ?? {};
  const links = [
    ["仓库", plugin.repo_url],
    ["主页", plugin.homepage],
    ["下载", plugin.download_url],
    ["发布页", plugin.releases_url]
  ].filter(([, url]) => Boolean(url));

  elements.pluginDetail.innerHTML = `
    <div class="detail-head">
      ${plugin.icon
        ? `<img class="detail-icon" src="${escapeHtml(plugin.icon)}" alt="${escapeHtml(plugin.name)} icon" />`
        : `<div class="detail-icon icon-placeholder">${escapeHtml(plugin.name.slice(0, 2))}</div>`}
      <div>
        <h2>${escapeHtml(plugin.name)}</h2>
        <p class="detail-subtitle">${escapeHtml(plugin.author)} · ${escapeHtml(formatVersion(plugin.version))}</p>
        <div class="detail-tags">
          <span class="chip">${plugin.kind === "core" ? "核心项目" : "插件"}</span>
          ${plugin.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
          <span class="chip">${escapeHtml(getCategoryLabel(plugin.category))}</span>
          ${plugin.verified ? '<span class="chip">已验证</span>' : ""}
          ${plugin.source_available ? '<span class="chip">可获取源码</span>' : ""}
          ${!plugin.source_available ? '<span class="chip">闭源</span>' : ""}
          ${plugin.visibility === "restricted" ? '<span class="chip">需加入群组或受限获取</span>' : ""}
          ${plugin.distribution?.type ? `<span class="chip">${escapeHtml(getDistributionLabel(plugin.distribution.type))}</span>` : ""}
        </div>
      </div>
    </div>
    <section class="detail-section">
      <p class="detail-copy">${escapeHtml(plugin.description || plugin.summary)}</p>
    </section>
    <section class="detail-section">
      <h3>兼容性</h3>
      <div class="detail-tags">
        <span class="chip">${escapeHtml(formatPenModsCompatibility(plugin.compatibility?.penmods))}</span>
      </div>
      <div class="detail-feature-grid">
        ${renderCapabilityGroup("需要", capabilities.requires)}
        ${renderCapabilityGroup("冲突", capabilities.conflicts)}
        ${renderCapabilityGroup("可选", capabilities.optional)}
      </div>
    </section>
    <section class="detail-section">
      <h3>提供的能力</h3>
      <div class="detail-tags">
        ${
          plugin.provides?.length
            ? plugin.provides.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")
            : '<span class="chip">未声明提供的能力</span>'
        }
      </div>
    </section>
    ${renderCapabilityHistory(plugin.compatibility?.capability_history)}
    <section class="detail-section">
      <h3>依赖关系</h3>
      <div class="detail-feature-grid">
        ${renderDependencyGroup("必需", plugin.dependencies?.required)}
        ${renderDependencyGroup("可选", plugin.dependencies?.optional)}
        ${renderDependencyGroup("协作", plugin.dependencies?.peer)}
        ${renderDependencyGroup("不兼容", plugin.dependencies?.incompatible)}
      </div>
    </section>
    <section class="detail-section">
      <h3>相关链接</h3>
      <div class="detail-links">
        ${links
          .map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
          .join("")}
      </div>
    </section>
    <section class="detail-section">
      <h3>分发方式</h3>
      <div class="detail-tags">
        <span class="chip">${escapeHtml(getDistributionLabel(plugin.distribution?.type || "other"))}</span>
        <span class="chip">${plugin.visibility === "restricted" ? "受限获取" : "公开获取"}</span>
      </div>
      <div class="detail-links">
        ${
          plugin.distribution?.url
            ? `<a href="${escapeHtml(plugin.distribution.url)}" target="_blank" rel="noreferrer">${escapeHtml(plugin.distribution.url)}</a>`
            : ""
        }
      </div>
      ${
        plugin.distribution?.notes
          ? `<p class="detail-copy">${escapeHtml(plugin.distribution.notes)}</p>`
          : ""
      }
    </section>
  `;
}

async function loadData() {
  const [statsResponse, indexResponse, pluginsResponse] = await Promise.all([
    fetch("./data/stats.json"),
    fetch("./data/index.json"),
    fetch("./data/plugins.json")
  ]);

  const stats = await statsResponse.json();
  const indexData = await indexResponse.json();
  const pluginsData = await pluginsResponse.json();

  renderStats(stats);
  state.listPlugins = indexData.plugins;
  state.fullPlugins = pluginsData.plugins;
  buildTagOptions();
  buildCategoryOptions();

  state.selectedId = window.location.hash.replace(/^#/, "") || state.listPlugins[0]?.id || null;
  filterPlugins();
}

elements.searchInput.addEventListener("input", filterPlugins);
elements.categoryFilter.addEventListener("change", filterPlugins);
elements.themeToggle.addEventListener("click", toggleTheme);

let heroCompact = false;
let heroScrollFrame = null;

function updateHeroCompact() {
  heroScrollFrame = null;
  const shouldCompact = heroCompact ? window.scrollY > 48 : window.scrollY > 120;

  if (shouldCompact === heroCompact) {
    return;
  }

  heroCompact = shouldCompact;
  elements.hero.classList.toggle("is-compact", heroCompact);
}

window.addEventListener("scroll", () => {
  if (heroScrollFrame !== null) {
    return;
  }
  heroScrollFrame = requestAnimationFrame(updateHeroCompact);
}, { passive: true });
window.addEventListener("hashchange", () => {
  state.selectedId = window.location.hash.replace(/^#/, "");
  renderPluginList();
  renderPluginDetail();
});

updateThemeToggle();
loadData().catch((error) => {
  elements.pluginList.innerHTML = `<div class="empty-state">加载索引数据失败：${escapeHtml(
    error.message
  )}</div>`;
});
