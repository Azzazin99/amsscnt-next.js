/**
 * Extract legacy menu hierarchy from smart_kpp2 → HTML fragment for context.html §2.2
 *
 * Usage:
 *   npm run legacy:extract-menu
 *   npm run legacy:extract-menu -- --stdout
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MARKER_START = "<!-- LEGACY-MENU-STRUCTURE:START -->";
const MARKER_END = "<!-- LEGACY-MENU-STRUCTURE:END -->";
const CONTEXT_PATH = resolve(process.cwd(), "context.html");

const SLUG_TO_FOLDER: Record<string, string> = { la: "leave" };
const FOLDER_TO_SLUG: Record<string, string> = { leave: "la" };

type LeafNode = { label: string; task?: string; file?: string; href?: string };
type DirNode = { label: string; items: LeafNode[] };
type ModuleNode = {
  slug: string;
  folder: string;
  name: string;
  active: boolean;
  order: number;
  whereWork: number;
  rootItems: LeafNode[];
  dirs: DirNode[];
  hasMenu: boolean;
};
type MenuGroup = {
  id: number;
  name: string;
  order: number;
  modules: ModuleNode[];
};

function resolveSmartKpp2Root(): string {
  const base = process.env.SMART_KPP2_PATH ?? resolve(process.cwd(), "../smart_kpp2");
  if (!existsSync(base)) {
    console.error(`ไม่พบ smart_kpp2 ที่ ${base}`);
    console.error("ตั้ง SMART_KPP2_PATH หรือ clone ไว้ที่ ../smart_kpp2");
    process.exit(1);
  }
  return base;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseSqlInserts(sql: string, table: string): string[][] {
  const rows: string[][] = [];
  const re = new RegExp(
    `INSERT INTO \`${table}\`[^;]+VALUES\\s*\\(([^)]+)\\);`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const tuple = m[1];
    const fields: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < tuple.length; i++) {
      const c = tuple[i];
      if (c === "'" && tuple[i - 1] !== "\\") {
        inQ = !inQ;
        cur += c;
      } else if (c === "," && !inQ) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    if (cur) fields.push(cur.trim());
    rows.push(fields.map((f) => f.replace(/^'|'$/g, "").replace(/\\'/g, "'")));
  }
  return rows;
}

function parseHref(href: string): Pick<LeafNode, "task" | "file" | "href"> {
  const taskM = href.match(/(?:^|[?&])task=([^&'"]+)/);
  const fileM = href.match(/(?:^|[?&])file=([^&'"]+)/);
  if (taskM) return { task: decodeURIComponent(taskM[1]) };
  if (fileM) return { file: decodeURIComponent(fileM[1]) };
  if (href && href !== "./" && href !== "?") return { href };
  return {};
}

type RawMenuItem = { label: string; href: string; isDir: boolean };

function parseMenuPhp(content: string): { rootItems: LeafNode[]; dirs: DirNode[] } {
  const raw: RawMenuItem[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.includes('echo "<li><a')) continue;
    if (trimmed.includes("$")) continue;

    const full = trimmed.match(
      /echo\s+"<li><a href='([^']*)'([^>]*)>(.*?)<\/a><\/li>";/,
    );
    if (full) {
      let label = stripHtml(full[3]);
      if (!label || label.includes("$")) label = label.includes("$") ? "(dynamic)" : "(unknown)";
      if (label === "(unknown)") continue;
      raw.push({
        href: full[1],
        label,
        isDir: /class='dir'/.test(full[2]) || /class="dir"/.test(full[2]),
      });
      continue;
    }

    const dirOnly = trimmed.match(
      /echo\s+"<li><a href='([^']*)'([^>]*)>(.*?)<\/a>";/,
    );
    if (dirOnly) {
      let label = stripHtml(dirOnly[3]);
      if (!label || label.includes("$")) label = label.includes("$") ? "(dynamic)" : "(unknown)";
      if (label === "(unknown)") continue;
      raw.push({
        href: dirOnly[1],
        label,
        isDir: true,
      });
    }
  }

  const rootItems: LeafNode[] = [];
  const dirs: DirNode[] = [];
  let currentDir: DirNode | null = null;

  for (const item of raw) {
    const leaf: LeafNode = { label: item.label, ...parseHref(item.href) };
    if (item.isDir) {
      currentDir = { label: item.label, items: [] };
      dirs.push(currentDir);
      continue;
    }
    if (currentDir) {
      currentDir.items.push(leaf);
    } else {
      rootItems.push(leaf);
    }
  }

  return { rootItems, dirs };
}

function folderForSlug(slug: string): string {
  return SLUG_TO_FOLDER[slug] ?? slug;
}

function slugForFolder(folder: string): string {
  return FOLDER_TO_SLUG[folder] ?? folder;
}

function findMenuPhp(modulesRoot: string, folder: string): string | null {
  const candidates = [
    join(modulesRoot, folder, "menu.php"),
    join(modulesRoot, folder, "main", "menu.php"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function listMenuFolders(modulesRoot: string): string[] {
  if (!existsSync(modulesRoot)) return [];
  return readdirSync(modulesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => findMenuPhp(modulesRoot, name) !== null)
    .sort();
}

function buildTree(root: string): {
  groups: MenuGroup[];
  userMenu: LeafNode[];
  orphans: ModuleNode[];
} {
  const sqlPath = join(root, "smart_area.sql");
  if (!existsSync(sqlPath)) {
    console.error(`ไม่พบ ${sqlPath}`);
    process.exit(1);
  }
  const sql = readFileSync(sqlPath, "utf8");
  const modulesRoot = join(root, "modules");

  const groupRows = parseSqlInserts(sql, "system_menugroup");
  const moduleRows = parseSqlInserts(sql, "system_module");

  const groups: MenuGroup[] = groupRows
    .map((f) => ({
      id: Number(f[1]),
      name: stripHtml(f[3]),
      order: Number(f[4]),
      modules: [] as ModuleNode[],
    }))
    .sort((a, b) => a.order - b.order);

  const groupById = new Map(groups.map((g) => [g.id, g]));
  const slugToModule = new Map<string, ModuleNode>();

  for (const f of moduleRows) {
    const slug = f[1];
    const folder = folderForSlug(slug);
    const menuPath = findMenuPhp(modulesRoot, folder);
    const menu = menuPath ? parseMenuPhp(readFileSync(menuPath, "utf8")) : null;

    const mod: ModuleNode = {
      slug,
      folder,
      name: stripHtml(f[3]),
      active: Number(f[5]) === 1,
      order: Number(f[6]),
      whereWork: Number(f[9]) || 0,
      rootItems: menu?.rootItems ?? [],
      dirs: menu?.dirs ?? [],
      hasMenu: Boolean(menuPath),
    };
    slugToModule.set(slug, mod);
    const g = groupById.get(Number(f[4]));
    if (g) g.modules.push(mod);
  }

  for (const g of groups) {
    g.modules.sort((a, b) => a.order - b.order);
  }

  const menuFolders = listMenuFolders(modulesRoot);
  const knownFolders = new Set(
    [...slugToModule.values()].map((m) => m.folder),
  );
  const orphans: ModuleNode[] = [];

  for (const folder of menuFolders) {
    const slug = slugForFolder(folder);
    if (knownFolders.has(folder) || slugToModule.has(slug)) continue;
    const menuPath = findMenuPhp(modulesRoot, folder)!;
    const menu = parseMenuPhp(readFileSync(menuPath, "utf8"));
    orphans.push({
      slug,
      folder,
      name: folder,
      active: false,
      order: 999,
      whereWork: 0,
      ...menu,
      hasMenu: true,
    });
  }
  orphans.sort((a, b) => a.folder.localeCompare(b.folder));

  const rootMenu = readFileSync(join(root, "menu.php"), "utf8");
  const userRaw = parseMenuPhp(rootMenu);
  const userMenu = [...userRaw.rootItems, ...userRaw.dirs.flatMap((d) => d.items)];

  return { groups, userMenu, orphans };
}

function renderLeaf(leaf: LeafNode): string {
  const parts = [escapeHtml(leaf.label)];
  if (leaf.task) {
    parts.push(`<code class="menu-task">task=${escapeHtml(leaf.task)}</code>`);
  } else if (leaf.file) {
    parts.push(`<code class="menu-task">file=${escapeHtml(leaf.file)}</code>`);
  } else if (leaf.href) {
    parts.push(`<code class="menu-task">${escapeHtml(leaf.href)}</code>`);
  }
  return `<li>${parts.join(" ")}</li>`;
}

function renderModule(mod: ModuleNode): string {
  const folderNote =
    mod.folder !== mod.slug
      ? ` <span class="meta">(โฟลเดอร์: <code>${escapeHtml(mod.folder)}/</code>)</span>`
      : "";
  const badge = mod.active
    ? '<span class="badge badge-ok">active</span>'
    : '<span class="badge badge-warn">ปิด</span>';

  let inner = "";
  if (!mod.hasMenu) {
    inner = '<p class="meta"><em>ไม่มี menu.php</em></p>';
  } else {
    const blocks: string[] = [];
    if (mod.rootItems.length > 0) {
      blocks.push(
        `<ul class="menu-tree">${mod.rootItems.map(renderLeaf).join("")}</ul>`,
      );
    }
    for (const dir of mod.dirs) {
      const items =
        dir.items.length > 0
          ? `<ul class="menu-tree">${dir.items.map(renderLeaf).join("")}</ul>`
          : '<p class="meta"><em>(ไม่มีรายการย่อย)</em></p>';
      blocks.push(
        `<details class="legacy-menu-dir"><summary>${escapeHtml(dir.label)}</summary>${items}</details>`,
      );
    }
    if (blocks.length === 0) {
      blocks.push('<p class="meta"><em>(menu.php ว่าง)</em></p>');
    }
    inner = blocks.join("\n");
  }

  return `<details class="legacy-menu-module" id="legacy-menu-${escapeHtml(mod.slug)}">
  <summary><code>${escapeHtml(mod.slug)}</code> — ${escapeHtml(mod.name)} ${badge}${folderNote}</summary>
  ${inner}
</details>`;
}

function renderHtml(tree: ReturnType<typeof buildTree>): string {
  const tocParts = [
    `<a href="#legacy-menu-user">ผู้ใช้ (User)</a>`,
    ...tree.groups.map(
      (g) =>
        `<a href="#legacy-menu-g${g.id}">${escapeHtml(g.name)}</a>`,
    ),
  ];
  if (tree.orphans.length > 0) {
    tocParts.push(`<a href="#legacy-menu-orphans">โฟลเดอร์นอก DB</a>`);
  }

  const sections: string[] = [
    `<nav class="menu-tree-toc" aria-label="สารบัญเมนู legacy">${tocParts.join(" · ")}</nav>`,
    `<details class="legacy-menu-group" id="legacy-menu-user" open>
  <summary>L0 — ผู้ใช้ (User)</summary>
  <ul class="menu-tree">${tree.userMenu.map(renderLeaf).join("")}</ul>
</details>`,
  ];

  tree.groups.forEach((g, idx) => {
    const open = idx === 0 ? " open" : "";
    sections.push(
      `<details class="legacy-menu-group" id="legacy-menu-g${g.id}"${open}>
  <summary>L1 — ${escapeHtml(g.name)}</summary>
  ${g.modules.map(renderModule).join("\n")}
</details>`,
    );
  });

  if (tree.orphans.length > 0) {
    sections.push(
      `<details class="legacy-menu-group" id="legacy-menu-orphans">
  <summary>โฟลเดอร์ PHP ที่มี menu.php แต่ไม่มีใน system_module</summary>
  ${tree.orphans.map(renderModule).join("\n")}
</details>`,
    );
  }

  const generated = new Date().toISOString().slice(0, 10);
  return `${MARKER_START}
<p class="meta">สร้างอัตโนมัติจาก <code>npm run legacy:extract-menu</code> · ${generated}</p>
${sections.join("\n")}
${MARKER_END}`;
}

function main() {
  const stdoutOnly = process.argv.includes("--stdout");
  const root = resolveSmartKpp2Root();
  const tree = buildTree(root);
  const fragment = renderHtml(tree);

  const moduleCount = tree.groups.reduce((n, g) => n + g.modules.length, 0);
  const leafCount = tree.groups.reduce(
    (n, g) =>
      n +
      g.modules.reduce(
        (m, mod) =>
          m + mod.rootItems.length + mod.dirs.reduce((d, dir) => d + dir.items.length, 0),
        0,
      ),
    0,
  );

  console.log(
    `extracted: ${tree.groups.length} groups, ${moduleCount} modules, ${leafCount} menu leaves, ${tree.orphans.length} orphans`,
  );

  if (stdoutOnly) {
    console.log(fragment);
    return;
  }

  let context = readFileSync(CONTEXT_PATH, "utf8");
  const start = context.indexOf(MARKER_START);
  const end = context.indexOf(MARKER_END);

  if (start === -1 || end === -1) {
    console.error("ไม่พบ marker ใน context.html");
    process.exit(1);
  }

  context =
    context.slice(0, start) + fragment + context.slice(end + MARKER_END.length);
  writeFileSync(CONTEXT_PATH, context, "utf8");
  console.log(`patched ${CONTEXT_PATH}`);
}

main();
