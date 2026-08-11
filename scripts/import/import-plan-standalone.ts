/**
 * Import plan module from legacy plan_* tables into plan_* (idempotent).
 *
 * Usage:
 *   npm run db:import-plan
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  planActivities,
  planPermissions,
  planProjects,
  planStrategies,
  planYears,
} from "../../src/lib/db/schema";
import {
  cleanText,
  legacyTableExists,
  normalizeLegacyDate,
  normalizeLegacyTimestamp,
  parseLegacyBool,
} from "./shared";

type Row = Record<string, unknown>;

async function legacyQuery(queryStr: string): Promise<Row[]> {
  const [rows] = await db.execute(sql.raw(queryStr));
  return rows as Row[];
}

async function insertBatchIgnore<T extends Record<string, any>>(
  table: any,
  batch: T[],
) {
  if (batch.length === 0) return;
  try {
    await db.insert(table).ignore().values(batch);
  } catch (err: any) {
    console.warn(
      `    Batch insert failed (${err?.message ?? err}), falling back to single inserts…`,
    );
    for (const item of batch) {
      try {
        await db.insert(table).ignore().values(item);
      } catch {
        // ignore single row error
      }
    }
  }
}

async function truncateTargets() {
  console.log("Truncating plan target tables…");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  const tables = [
    "plan_years",
    "plan_strategies",
    "plan_projects",
    "plan_activities",
    "plan_permissions",
  ];
  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function importYears(): Promise<number> {
  if (!(await legacyTableExists("plan_year"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `plan_year` ORDER BY budget_year");
  let batch: (typeof planYears.$inferInsert)[] = [];
  let count = 0;

  for (const row of rows) {
    const budgetYear = Number(row.budget_year);
    if (!Number.isFinite(budgetYear)) continue;

    batch.push({
      budgetYear,
      yearActive: parseLegacyBool(row.year_active),
    });
  }

  if (batch.length) {
    await insertBatchIgnore(planYears, batch);
    count = batch.length;
  }
  return count;
}

async function importStrategies(): Promise<number> {
  if (!(await legacyTableExists("plan_stregic"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `plan_stregic` ORDER BY id");
  let batch: (typeof planStrategies.$inferInsert)[] = [];
  let count = 0;

  for (const row of rows) {
    const budgetYear = Number(row.budget_year);
    const codeTegy = String(row.id_tegic ?? row.code_tegy ?? row.id ?? "").trim();
    const nameTegy = cleanText(row.strategic ?? row.name_tegy);
    if (!Number.isFinite(budgetYear) || !codeTegy || !nameTegy) continue;

    batch.push({
      budgetYear,
      codeTegy,
      nameTegy,
      idTegic: codeTegy,
      strategic: nameTegy,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(planStrategies, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(planStrategies, batch);
    count += batch.length;
  }
  return count;
}

async function importProjects(): Promise<number> {
  if (!(await legacyTableExists("plan_proj"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `plan_proj` ORDER BY id");
  let batch: (typeof planProjects.$inferInsert)[] = [];
  let count = 0;

  for (const row of rows) {
    const budgetYear = Number(row.budget_year);
    const codeProj = String(row.code_proj ?? "").trim();
    const nameProj = cleanText(row.name_proj);
    if (!Number.isFinite(budgetYear) || !codeProj || !nameProj) continue;

    const beginDate = normalizeLegacyDate(row.begin_date) ?? "1970-01-01";
    const finishDate = normalizeLegacyDate(row.finish_date) ?? "1970-01-01";

    batch.push({
      budgetYear,
      codeClus: Number(row.code_clus ?? 0),
      codeTegy: row.code_tegy ? String(row.code_tegy).trim() : "1",
      codeProj,
      budgetProj: Number(row.budget_proj ?? 0),
      nameProj,
      ownerProj: String(row.owner_proj ?? "").trim(),
      beginDate,
      finishDate,
      fileDetail: row.file_detail ? String(row.file_detail).trim() : null,
      dayrec: normalizeLegacyTimestamp(row.dayrec),
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(planProjects, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(planProjects, batch);
    count += batch.length;
  }
  return count;
}

async function importActivities(): Promise<number> {
  if (!(await legacyTableExists("plan_acti"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `plan_acti` ORDER BY id");
  let batch: (typeof planActivities.$inferInsert)[] = [];
  let count = 0;

  for (const row of rows) {
    const budgetYear = Number(row.budget_year);
    const codeProj = String(row.code_proj ?? "").trim();
    const codeActi = String(row.code_acti ?? "").trim();
    const nameActi = cleanText(row.name_acti);
    if (!Number.isFinite(budgetYear) || !codeActi || !nameActi) continue;

    const beginDate = normalizeLegacyDate(row.begin_date) ?? "1970-01-01";
    const finishDate = normalizeLegacyDate(row.finish_date) ?? "1970-01-01";

    batch.push({
      budgetYear,
      codeClus: Number(row.code_clus ?? 0),
      codeProj,
      codeActi,
      codeApprove: row.code_approve ? String(row.code_approve).trim() : "",
      budgetActi: Number(row.budget_acti ?? 0),
      nameActi,
      ownerActi: String(row.owner_acti ?? "").trim(),
      beginDate,
      finishDate,
      stop: row.stop != null ? Number(row.stop) : null,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(planActivities, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(planActivities, batch);
    count += batch.length;
  }
  return count;
}

async function importPermissions(): Promise<number> {
  if (!(await legacyTableExists("plan_permission"))) return 0;
  const rows = await legacyQuery("SELECT * FROM `plan_permission` ORDER BY id");
  let batch: (typeof planPermissions.$inferInsert)[] = [];
  let count = 0;

  for (const row of rows) {
    const personId = String(row.id_person ?? row.person_id ?? "").trim();
    if (!personId) continue;

    const recDate = normalizeLegacyDate(row.rec_date) ?? "1970-01-01";

    batch.push({
      personId,
      permAdd: Number(row.perm_add ?? 0),
      permEdit: Number(row.perm_edit ?? 0),
      permDele: Number(row.perm_dele ?? 0),
      officer: String(row.officer ?? "").trim(),
      recDate,
    });

    if (batch.length >= 500) {
      await insertBatchIgnore(planPermissions, batch);
      count += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await insertBatchIgnore(planPermissions, batch);
    count += batch.length;
  }
  return count;
}

async function main() {
  console.log("=== Import Planning Module (plan) ===\n");

  if (!(await legacyTableExists("plan_proj"))) {
    console.error(
      "Legacy table `plan_proj` not found.\n" +
        "Make sure you've run: bash scripts/load-legacy-plan.sh",
    );
    process.exit(1);
  }

  await truncateTargets();

  console.log("\nImporting…");
  const years = await importYears();
  console.log(`  plan_years: ${years} rows`);

  const strategies = await importStrategies();
  console.log(`  plan_strategies: ${strategies} rows`);

  const projects = await importProjects();
  console.log(`  plan_projects: ${projects} rows`);

  const activities = await importActivities();
  console.log(`  plan_activities: ${activities} rows`);

  const permissions = await importPermissions();
  console.log(`  plan_permissions: ${permissions} rows`);

  console.log("\n=== Done ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err?.message ?? err);
    process.exit(1);
  });
