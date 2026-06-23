import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { queryClient } from "../src/lib/db";

const BOOKREGISTER_DIRS = [
  { legacy: "upload_files1", kind: "receive" },
  { legacy: "upload_files2", kind: "send" },
  { legacy: "upload_files3", kind: "command" },
  { legacy: "upload_files4", kind: "certificate" },
] as const;

const LEGACY_ROOT_CANDIDATES = [
  { label: "AMSSPLUS_PATH", fallback: "../Amssplus" },
  { label: "SMART_KPP2_PATH", fallback: "../smart_kpp2" },
] as const;

function resolveLegacyModuleRoots(
  moduleName: string,
): { label: string; root: string }[] {
  const roots: { label: string; root: string }[] = [];
  for (const { label, fallback } of LEGACY_ROOT_CANDIDATES) {
    const base = process.env[label] ?? resolve(process.cwd(), fallback);
    const moduleRoot = join(base, "modules", moduleName);
    if (existsSync(moduleRoot)) {
      roots.push({ label, root: moduleRoot });
    }
  }
  return roots;
}

const FILE_NAME_QUERIES: { table: string; column: string }[] = [
  { table: "register_receive_files", column: "file_name" },
  { table: "register_send_files", column: "file_name" },
  { table: "register_commands", column: "file_name" },
  { table: "register_certificates", column: "file_name" },
  { table: "bookregister_command", column: "file_name" },
  { table: "bookregister_receive_filebook", column: "file_name" },
  { table: "bookregister_send_filebook", column: "file_name" },
  { table: "bookregister_certificate", column: "file_name" },
  { table: "book_files", column: "file_name" },
  { table: "mail_files", column: "file_name" },
];

async function tableExists(table: string): Promise<boolean> {
  const rows = await queryClient<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS ok
  `;
  return rows[0]?.ok ?? false;
}

async function collectFileNames(): Promise<Set<string>> {
  const fileNames = new Set<string>();
  for (const { table, column } of FILE_NAME_QUERIES) {
    if (!(await tableExists(table))) continue;

    const rows = (await queryClient.unsafe(
      `SELECT DISTINCT "${column}" AS file_name FROM "${table}" WHERE "${column}" IS NOT NULL AND "${column}" <> '' LIMIT 5000`,
    )) as { file_name: string }[];
    for (const row of rows) {
      if (row.file_name) fileNames.add(row.file_name);
    }
  }
  return fileNames;
}

function copyFromDir(input: {
  srcDir: string;
  destDir: string;
  label: string;
  fileNames: Set<string>;
}) {
  let copied = 0;
  let skipped = 0;
  if (!existsSync(input.srcDir)) return { copied, skipped };

  mkdirSync(input.destDir, { recursive: true });
  for (const name of readdirSync(input.srcDir)) {
    const src = join(input.srcDir, name);
    if (!statSync(src).isFile()) continue;
    if (name === "index.php" || name === ".DS_Store") continue;
    if (input.fileNames.size > 0 && !input.fileNames.has(name)) {
      skipped++;
      continue;
    }
    copyFileSync(src, join(input.destDir, name));
    copied++;
    console.log(`  [${input.label}] → ${name}`);
  }
  return { copied, skipped };
}

async function main() {
  const storage =
    process.env.STORAGE_PATH ?? resolve(process.cwd(), "storage");
  const fileNames = await collectFileNames();
  console.log(`DB file_name entries: ${fileNames.size}`);

  let totalCopied = 0;
  let totalSkipped = 0;

  const bookregisterRoots = resolveLegacyModuleRoots("bookregister");
  if (bookregisterRoots.length === 0) {
    console.warn(
      "No legacy bookregister folder found. Set AMSSPLUS_PATH and/or SMART_KPP2_PATH.",
    );
  } else {
    console.log("Legacy bookregister sources:");
    for (const { label, root } of bookregisterRoots) {
      console.log(`  - ${label}: ${root}`);
    }
    for (const { label, root: bookregisterRoot } of bookregisterRoots) {
      for (const { legacy, kind } of BOOKREGISTER_DIRS) {
        const result = copyFromDir({
          srcDir: join(bookregisterRoot, legacy),
          destDir: join(storage, "bookregister", kind),
          label: `${label}/bookregister/${legacy}`,
          fileNames,
        });
        totalCopied += result.copied;
        totalSkipped += result.skipped;
      }
    }
  }

  for (const moduleName of ["book", "mail"] as const) {
    const roots = resolveLegacyModuleRoots(moduleName);
    if (roots.length === 0) continue;
    console.log(`Legacy ${moduleName} sources:`);
    for (const { label, root } of roots) {
      console.log(`  - ${label}: ${root}`);
      const result = copyFromDir({
        srcDir: join(root, "upload_files"),
        destDir: join(storage, moduleName),
        label: `${label}/${moduleName}/upload_files`,
        fileNames,
      });
      totalCopied += result.copied;
      totalSkipped += result.skipped;
    }
  }

  console.log(
    `Done: copied ${totalCopied} file(s) under ${storage}/ (skipped ${totalSkipped} not in DB)`,
  );
  if (totalCopied === 0) {
    console.warn(
      "No files copied — legacy upload_files* folders may be empty locally; use production/rsync backup.",
    );
  }
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
