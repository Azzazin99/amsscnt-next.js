import "dotenv/config";
import bcrypt from "bcryptjs";
import { existsSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db, queryClient } from "../src/lib/db";
import { formatPersonName } from "../src/lib/auth/format-name";
import { CHAINAT_WORKGROUPS } from "./data/workgroups-chainat";
import { importBook } from "./import/import-book";
import { importLeave } from "./import/import-leave";
import { importMail } from "./import/import-mail";
import {
  cleanText,
  deriveOfficeCodeFromLegacySchools,
  legacyTableExists,
  normalizeLegacyDate,
  uniqueRefId,
} from "./import/shared";
import {
  defaultChainatMasterXlsxPath,
  parseChainatMasterXlsx,
} from "./parse-chainat-master-xlsx";
import {
  defaultChainatSchoolsXlsxPath,
  parseChainatSchoolsXlsx,
} from "./parse-chainat-schools-xlsx";
import {
  districtSettings,
  menuGroups,
  moduleAdmins,
  modules,
  people,
  personSchoolAssignments,
  registerCertificates,
  registerCommands,
  registerPermissions,
  registerReceiveFiles,
  registerReceives,
  registerSendFiles,
  registerSends,
  registerYears,
  schools,
  schoolGroups,
  users,
  workgroups,
} from "../src/lib/db/schema";

type Scope = "core" | "bookregister" | "mail" | "book" | "leave" | "full";

const SCOPES: Record<Scope, Scope[]> = {
  core: ["core"],
  bookregister: ["core", "bookregister"],
  mail: ["core", "mail"],
  book: ["core", "book"],
  leave: ["core", "leave"],
  full: ["core", "bookregister", "mail", "book", "leave"],
};

function parseArgs() {
  const scopeArg =
    process.argv.find((a) => a.startsWith("--scope="))?.split("=")[1] ??
    "core,bookregister";
  const scopes = new Set<Scope>();
  for (const part of scopeArg.split(",")) {
    const s = part.trim() as Scope;
    if (s in SCOPES) {
      for (const x of SCOPES[s]) scopes.add(x);
    }
  }
  if (scopes.size === 0) {
    scopes.add("core");
    scopes.add("bookregister");
  }

  const explicitLegacyMaster = process.argv.includes("--legacy-master");
  const legacyMaster =
    explicitLegacyMaster ||
    process.env.AMSS_IMPORT_LEGACY_MASTER === "1" ||
    scopes.has("mail") ||
    scopes.has("book");

  return {
    scopes,
    skipLegacyCheck: process.argv.includes("--skip-legacy-load"),
    legacyMaster,
  };
}

async function assertLegacyLoaded(skip: boolean) {
  if (skip) return;
  const ok = await legacyTableExists("system_user");
  if (!ok) {
    console.error(
      "Legacy tables not found. Run: npm run db:load-legacy\n" +
        "Or pass --skip-legacy-load if legacy data is already loaded.",
    );
    process.exit(1);
  }
}

async function truncateAppTables(scopes: Set<Scope>) {
  try {
    await db.execute(sql`SET session_replication_role = 'replica'`);
  } catch {
    // Non-superuser local dev — TRUNCATE CASCADE is enough.
  }
  const tables: string[] = [];
  if (scopes.has("mail")) {
    tables.push(
      "mail_files",
      "mail_recipients",
      "mail_documents",
      "mail_group_members",
      "mail_groups",
      "mail_permissions",
    );
  }
  if (scopes.has("book")) {
    tables.push(
      "book_files",
      "book_recipients",
      "book_documents",
      "book_group_members",
      "book_groups",
      "book_permissions",
    );
  }
  if (scopes.has("bookregister")) {
    tables.push(
      "register_certificates",
      "register_commands",
      "register_sends",
      "register_receives",
      "register_receive_files",
      "register_send_files",
      "register_permissions",
      "register_years",
    );
  }
  if (scopes.has("leave")) {
    tables.push(
      "leave_cancellations",
      "leave_request_files",
      "leave_requests",
      "leave_quota_balances",
      "leave_person_settings",
      "leave_permissions",
      "leave_years",
    );
  }
  if (scopes.has("core")) {
    tables.push(
      "module_admins",
      "modules",
      "menu_groups",
      "person_school_assignments",
      "users",
      "people",
      "schools",
      "school_groups",
      "workgroups",
      "district_settings",
    );
  }
  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`));
  }
  try {
    await db.execute(sql`SET session_replication_role = 'origin'`);
  } catch {
    /* ignore */
  }
}

async function resolveDistrictInfo(legacyMaster: boolean) {
  if (legacyMaster) {
    const officeRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM system_office_name LIMIT 1`;
    if (officeRows[0]) {
      const officeCode =
        process.env.AMSS_OFFICE_CODE ??
        (await deriveOfficeCodeFromLegacySchools());
      return {
        districtName: cleanText(officeRows[0].office_name),
        officeCode,
      };
    }
  }
  return {
    districtName:
      process.env.AMSS_DISTRICT_NAME ??
      "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท",
    officeCode: process.env.AMSS_OFFICE_CODE ?? "1701",
  };
}

async function importCore(legacyMaster: boolean) {
  const { districtName, officeCode } = await resolveDistrictInfo(legacyMaster);

  await db.insert(districtSettings).values({
    officeName: districtName,
    officeCode,
  });

  const workgroupMap = new Map<number, number>();
  const useChainatWorkgroups = !legacyMaster && officeCode === "1701";

  if (useChainatWorkgroups) {
    console.log("workgroups: ใช้ seed สพป.ชัยนาท");
    for (const row of CHAINAT_WORKGROUPS) {
      const [inserted] = await db
        .insert(workgroups)
        .values({
          legacyCode: row.legacyCode,
          name: row.name,
          sortOrder: row.sortOrder,
          active: true,
        })
        .returning({ id: workgroups.id });
      workgroupMap.set(row.legacyCode, inserted.id);
    }
  } else {
    console.log("workgroups: ใช้จาก legacy dump");
    const wgRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM system_workgroup ORDER BY workgroup`;
    for (const row of wgRows) {
      const legacyCode = Number(row.workgroup);
      const [inserted] = await db
        .insert(workgroups)
        .values({
          legacyCode,
          name: cleanText(row.workgroup_desc),
          sortOrder: Number(row.workgroup_order ?? 0),
          active: true,
        })
        .returning({ id: workgroups.id });
      workgroupMap.set(legacyCode, inserted.id);
    }
  }

  const schoolGroupMap = new Map<number, number>();
  const groupNameToId = new Map<string, number>();
  const schoolCodeToGroupName = new Map<string, string>();

  const masterXlsx = defaultChainatMasterXlsxPath();
  if (!legacyMaster && existsSync(masterXlsx)) {
    console.log(`school_groups: ใช้ Excel ชัยนาท → ${masterXlsx}`);
    const { groups, assignments } = parseChainatMasterXlsx(masterXlsx);
    for (const group of groups) {
      const [inserted] = await db
        .insert(schoolGroups)
        .values({
          name: group.name,
          sortOrder: group.sortOrder,
          legacyId: null,
        })
        .returning({ id: schoolGroups.id });
      groupNameToId.set(group.name, inserted.id);
    }
    for (const row of assignments) {
      schoolCodeToGroupName.set(row.schoolCode, row.groupName);
    }
  } else {
    console.log("school_groups: ใช้จาก legacy dump");
    const sgRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM system_school_group ORDER BY id`;
    for (const row of sgRows) {
      const legacyId = Number(row.id);
      const [inserted] = await db
        .insert(schoolGroups)
        .values({
          legacyId,
          name: cleanText(row.name),
          sortOrder: Number(row.code ?? row.id ?? 0),
        })
        .returning({ id: schoolGroups.id });
      schoolGroupMap.set(legacyId, inserted.id);
    }
  }

  const schoolMap = new Map<string, number>();
  const chainatXlsx = defaultChainatSchoolsXlsxPath();
  if (!legacyMaster && existsSync(chainatXlsx)) {
    console.log(`schools: ใช้ Excel ชัยนาท → ${chainatXlsx}`);
    for (const row of parseChainatSchoolsXlsx(chainatXlsx)) {
      const groupName = schoolCodeToGroupName.get(row.schoolCode);
      const schoolGroupId = groupName
        ? (groupNameToId.get(groupName) ?? null)
        : null;
      const [inserted] = await db
        .insert(schools)
        .values({
          schoolCode: row.schoolCode,
          name: row.name,
          schoolType: 1,
          schoolGroupId,
          active: true,
        })
        .returning({ id: schools.id });
      schoolMap.set(row.schoolCode, inserted.id);
    }
  } else {
    console.log("schools: ใช้จาก legacy dump");
    const schRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM system_school ORDER BY school_code`;
    for (const row of schRows) {
      const code = String(row.school_code);
      const groupLegacy = Number(row.school_group ?? 0);
      const [inserted] = await db
        .insert(schools)
        .values({
          schoolCode: code,
          name: cleanText(row.school_name),
          schoolType: Number(row.school_type ?? 0),
          schoolGroupId: schoolGroupMap.get(groupLegacy) ?? null,
          active: true,
        })
        .returning({ id: schools.id });
      schoolMap.set(code, inserted.id);
    }
  }

  const serviceStartByPersonId = new Map<string, string>();
  const pdRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT person_id, start_day FROM person_detail`;
  for (const row of pdRows) {
    const start = normalizeLegacyDate(row.start_day);
    if (start) serviceStartByPersonId.set(String(row.person_id), start);
  }

  const personNames = new Map<string, string>();
  const pmRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM person_main WHERE status = '0'`;
  for (const row of pmRows) {
    const personId = String(row.person_id);
    const dept = Number(row.department ?? 0);
    await db.insert(people).values({
      personId,
      prefix: cleanText(row.prename),
      firstName: cleanText(row.name),
      lastName: cleanText(row.surname),
      workgroupId: workgroupMap.get(dept) ?? null,
      organizationType: "district",
      positionCode: Number(row.position_code ?? 0),
      status: Number(row.status ?? 0),
      multiSchool: false,
      serviceStartDate: serviceStartByPersonId.get(personId) ?? null,
    });
    personNames.set(
      personId,
      formatPersonName({
        prefix: cleanText(row.prename),
        firstName: cleanText(row.name),
        lastName: cleanText(row.surname),
      }),
    );
  }

  const psmRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM person_sch_main WHERE status = '0'`;
  for (const row of psmRows) {
    const personId = String(row.person_id);
    const schoolCode = String(row.school_code);
    const multi = Number(row.other ?? 0) === 1;
    await db.insert(people).values({
      personId,
      prefix: cleanText(row.prename),
      firstName: cleanText(row.name),
      lastName: cleanText(row.surname),
      schoolId: schoolMap.get(schoolCode) ?? null,
      organizationType: "school",
      positionCode: Number(row.position_code ?? 0),
      status: Number(row.status ?? 0),
      multiSchool: multi,
      serviceStartDate: serviceStartByPersonId.get(personId) ?? null,
    });
    personNames.set(
      personId,
      formatPersonName({
        prefix: cleanText(row.prename),
        firstName: cleanText(row.name),
        lastName: cleanText(row.surname),
      }),
    );
    if (multi) {
      const others = await queryClient<
        Record<string, unknown>[]
      >`SELECT pso.school_code FROM person_sch_other pso WHERE pso.person_id = ${personId}`;
      const codes = new Set([schoolCode, ...others.map((o) => String(o.school_code))]);
      for (const code of codes) {
        const sid = schoolMap.get(code);
        if (sid) {
          await db
            .insert(personSchoolAssignments)
            .values({ personId, schoolId: sid })
            .onConflictDoNothing();
        }
      }
    }
  }

  const mgRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM system_menugroup ORDER BY id`;
  const menuGroupMap = new Map<number, number>();
  for (const row of mgRows) {
    const legacyId = Number(row.id);
    const [inserted] = await db
      .insert(menuGroups)
      .values({
        legacyId: Number(row.menugroup ?? row.id),
        name: cleanText(row.menugroup_desc),
        sortOrder: Number(row.menugroup_order ?? 0),
      })
      .returning({ id: menuGroups.id });
    menuGroupMap.set(Number(row.menugroup ?? legacyId), inserted.id);
  }

  const modRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM system_module ORDER BY module_order`;
  for (const row of modRows) {
    const rawSlug = String(row.module);
    const slug = rawSlug === "la" ? "leave" : rawSlug;
    const rawName = cleanText(row.module_desc ?? row.module);
    await db.insert(modules).values({
      slug,
      name: slug === "mail" ? "ไปรษณีย์" : rawName,
      menuGroupId: menuGroupMap.get(Number(row.workgroup ?? 0)) ?? null,
      whereWork: Number(row.where_work ?? 0),
      active: Number(row.module_active ?? 1) === 1,
      sortOrder: Number(row.module_order ?? 0),
    });
  }

  const password = await bcrypt.hash(
    process.env.AMSS_IMPORT_PASSWORD ?? "Imported123",
    10,
  );
  const userMap = new Map<string, number>();
  const suRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM system_user WHERE status = '1'`;
  for (const row of suRows) {
    const personId = String(row.person_id);
    const username = String(row.username);
    const isSchool = Number(row.school_user ?? 0) === 1;
    const [inserted] = await db
      .insert(users)
      .values({
        username,
        personId,
        email: `${username}@import.local`,
        passwordHash: password,
        name: personNames.get(personId) ?? username,
        organizationType: isSchool ? "school" : "district",
        schoolId: null,
        isSuperAdmin: username === "admin" || Number(row.smss_admin ?? 0) === 1,
        isAdmin: Number(row.smss_admin ?? 0) === 1,
        status: Number(row.status ?? 1),
      })
      .returning({ id: users.id });
    userMap.set(personId, inserted.id);
  }

  const maRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM system_module_admin`;
  const slugMap: Record<string, string> = { student_main: "student" };
  for (const row of maRows) {
    const personId = String(row.person_id);
    const userId = userMap.get(personId);
    if (!userId) continue;
    const slug = slugMap[String(row.module)] ?? String(row.module);
    await db.insert(moduleAdmins).values({
      userId,
      moduleSlug: slug,
      assignedBy: userMap.get(String(row.officer ?? "")) ?? null,
    });
  }

  return { workgroupMap, schoolMap, userMap };
}

async function buildMapsFromDb(): Promise<{
  workgroupMap: Map<number, number>;
  schoolMap: Map<string, number>;
  userMap: Map<string, number>;
}> {
  const schoolRows = await db
    .select({ id: schools.id, schoolCode: schools.schoolCode })
    .from(schools);
  const userRows = await db
    .select({ id: users.id, personId: users.personId })
    .from(users);
  return {
    workgroupMap: new Map(),
    schoolMap: new Map(schoolRows.map((s) => [s.schoolCode, s.id])),
    userMap: new Map(userRows.map((u) => [u.personId, u.id])),
  };
}

async function importBookregister(
  maps: Awaited<ReturnType<typeof importCore>>,
) {
  const { workgroupMap, schoolMap, userMap } = maps;
  const seenRefIds = new Set<string>();
  const defaultWg = [...workgroupMap.values()][0] ?? null;

  const permRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM bookregister_permission`;
  for (const row of permRows) {
    const userId = userMap.get(String(row.person_id ?? ""));
    if (!userId) continue;
    await db.insert(registerPermissions).values({
      userId,
      p1: Number(row.p1 ?? 0),
      p2: Number(row.p2 ?? 0),
      p3: Number(row.p3 ?? 0),
      canViewSecret: false,
    });
  }

  const yearRows = await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM bookregister_year`;
  for (const row of yearRows) {
    const schoolCode = row.school_code ? String(row.school_code) : null;
    await db.insert(registerYears).values({
      year: Number(row.year),
      schoolId: schoolCode ? (schoolMap.get(schoolCode) ?? null) : null,
      yearActive: Number(row.year_active ?? 0) === 1,
      startReceiveNum: Number(row.start_receive_num ?? 1),
      startSendNum: Number(row.start_send_num ?? 1),
      startCommandNum: Number(row.start_command_num ?? 1),
      startCertificateNum: Number(row.start_cer_num ?? 1),
    });
  }

  async function loadReceiveRows(table: string, filterCode?: string) {
    if (filterCode) {
      return queryClient<
        Record<string, unknown>[]
      >`SELECT * FROM bookregister_receive_sch WHERE school_code = ${filterCode}`;
    }
    return queryClient.unsafe(`SELECT * FROM "${table}"`);
  }

  async function importReceives(table: string, schoolId: number | null, filterCode?: string) {
    const rows = await loadReceiveRows(table, filterCode);
    let batch: (typeof registerReceives.$inferInsert)[] = [];
    for (const row of rows) {
      batch.push({
        schoolId,
        year: Number(row.year),
        registerNumber: Number(row.register_number),
        bookNo: row.book_no ? String(row.book_no) : null,
        signdate: row.signdate ? String(row.signdate) : null,
        bookFrom: cleanText(row.book_from),
        bookTo: cleanText(row.book_to),
        subject: row.subject ? String(row.subject) : null,
        operation: row.operation ? String(row.operation) : null,
        workgroupId:
          workgroupMap.get(Number(row.workgroup ?? 0)) ?? defaultWg,
        recordType: Number(row.record_type ?? 1),
        comment: row.comment ? String(row.comment) : null,
        registerDate: row.register_date ? String(row.register_date) : null,
        refId: uniqueRefId(
          String(row.ref_id),
          Number(row.ms_id ?? 0),
          seenRefIds,
        ),
        officerId: userMap.get(String(row.officer ?? "")) ?? null,
        bookLink: Number(row.book_link ?? 0),
        source: Number(row.book_link ?? 0) > 0 ? "book_module" : "external",
        secret: Number(row.secret ?? 0) === 1,
        secretLevel: Number(row.secret ?? 0) === 1 ? 1 : 0,
        urgencyLevel: 1,
      });
      if (batch.length >= 250) {
        await db.insert(registerReceives).values(batch);
        batch = [];
      }
    }
    if (batch.length) await db.insert(registerReceives).values(batch);
  }

  await importReceives("bookregister_receive", null);
  if (await legacyTableExists("bookregister_receive_sch")) {
    for (const [code, sid] of schoolMap) {
      await importReceives("bookregister_receive_sch", sid, code);
    }
  }

  async function importReceiveFilebook(table: string) {
    if (!(await legacyTableExists(table))) return;

    const receiveRefRows = await db
      .select({ refId: registerReceives.refId })
      .from(registerReceives);
    const validRefIds = new Set(receiveRefRows.map((r) => r.refId));

    const rows = await queryClient.unsafe(`SELECT * FROM "${table}"`);
    let batch: (typeof registerReceiveFiles.$inferInsert)[] = [];
    for (const row of rows) {
      const refId = row.ref_id ? String(row.ref_id) : "";
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;

      batch.push({
        refId,
        fileName,
        fileDes: row.file_des ? String(row.file_des) : null,
      });
      if (batch.length >= 500) {
        await db.insert(registerReceiveFiles).values(batch);
        batch = [];
      }
    }
    if (batch.length) await db.insert(registerReceiveFiles).values(batch);
  }

  await importReceiveFilebook("bookregister_receive_filebook");
  if (await legacyTableExists("bookregister_receive_sch_filebook")) {
    await importReceiveFilebook("bookregister_receive_sch_filebook");
  }

  async function importSends(schoolId: number | null, filterCode?: string) {
    const rows = filterCode
      ? await queryClient<
          Record<string, unknown>[]
        >`SELECT * FROM bookregister_send_sch WHERE school_code = ${filterCode}`
      : await queryClient.unsafe(`SELECT * FROM "bookregister_send"`);
    let batch: (typeof registerSends.$inferInsert)[] = [];
    for (const row of rows) {
      batch.push({
        schoolId,
        year: Number(row.year),
        registerNumber: Number(row.register_number),
        bookNo: row.book_no ? String(row.book_no) : null,
        signdate: row.signdate ? String(row.signdate) : null,
        bookFrom: cleanText(row.book_from),
        bookTo: cleanText(row.book_to),
        subject: row.subject ? String(row.subject) : null,
        operation: row.operation ? String(row.operation) : null,
        workgroupId:
          workgroupMap.get(Number(row.workgroup ?? 0)) ?? defaultWg,
        comment: row.comment ? String(row.comment) : null,
        registerDate: row.register_date ? String(row.register_date) : null,
        refId: uniqueRefId(
          String(row.ref_id),
          Number(row.ms_id ?? 0),
          seenRefIds,
        ),
        officerId: userMap.get(String(row.officer ?? "")) ?? null,
        secret: Number(row.secret ?? 0) === 1,
        secretLevel: Number(row.secret ?? 0) === 1 ? 1 : 0,
        urgencyLevel: 1,
        officeType: Number(row.office_type ?? 1),
        forwardedToSchools: false,
      });
      if (batch.length >= 250) {
        await db.insert(registerSends).values(batch);
        batch = [];
      }
    }
    if (batch.length) await db.insert(registerSends).values(batch);
  }

  await importSends(null);
  if (await legacyTableExists("bookregister_send_sch")) {
    for (const [code, sid] of schoolMap) {
      await importSends(sid, code);
    }
  }

  async function importSendFilebook(table: string) {
    if (!(await legacyTableExists(table))) return;

    const sendRefRows = await db
      .select({ refId: registerSends.refId })
      .from(registerSends);
    const validRefIds = new Set(sendRefRows.map((r) => r.refId));

    const rows = await queryClient.unsafe(`SELECT * FROM "${table}"`);
    let batch: (typeof registerSendFiles.$inferInsert)[] = [];
    for (const row of rows) {
      const refId = row.ref_id ? String(row.ref_id) : "";
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;

      batch.push({
        refId,
        fileName,
        fileDes: row.file_des ? String(row.file_des) : null,
      });
      if (batch.length >= 500) {
        await db.insert(registerSendFiles).values(batch);
        batch = [];
      }
    }
    if (batch.length) await db.insert(registerSendFiles).values(batch);
  }

  await importSendFilebook("bookregister_send_filebook");
  if (await legacyTableExists("bookregister_send_sch_filebook")) {
    await importSendFilebook("bookregister_send_sch_filebook");
  }

  for (const row of await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM bookregister_command`) {
    await db.insert(registerCommands).values({
      schoolId: null,
      year: Number(row.year),
      registerNumber: Number(row.register_number),
      bookNo: row.book_no ? String(row.book_no) : null,
      signdate: row.signdate ? String(row.signdate) : null,
      subject: row.subject ? String(row.subject) : null,
      comment: row.comment ? String(row.comment) : null,
      registerDate: row.register_date ? String(row.register_date) : null,
      refId: uniqueRefId(
        String(row.ref_id ?? row.id),
        Number(row.ms_id ?? row.id ?? 0),
        seenRefIds,
      ),
      officerId: userMap.get(String(row.officer ?? "")) ?? null,
      secret: Number(row.secret ?? 0) === 1,
      fileName: row.file_name ? String(row.file_name) : null,
    });
  }

  for (const row of await queryClient<
    Record<string, unknown>[]
  >`SELECT * FROM bookregister_certificate`) {
    await db.insert(registerCertificates).values({
      schoolId: null,
      year: Number(row.year),
      registerNumber: Number(row.register_number),
      bookNo: row.book_no ? String(row.book_no) : null,
      signdate: row.signdate ? String(row.signdate) : null,
      subject: row.subject ? String(row.subject) : null,
      comment: row.comment ? String(row.comment) : null,
      registerDate: row.register_date ? String(row.register_date) : null,
      refId: uniqueRefId(
        String(row.ref_id ?? row.id),
        Number(row.ms_id ?? row.id ?? 0),
        seenRefIds,
      ),
      officerId: userMap.get(String(row.officer ?? "")) ?? null,
      secret: false,
      fileName: row.file_name ? String(row.file_name) : null,
    });
  }
}

async function main() {
  const { scopes, skipLegacyCheck, legacyMaster } = parseArgs();
  console.log("Import scope:", [...scopes].join(", "));
  if (legacyMaster) {
    console.log("Legacy master mode: ใช้ schools/people/users จาก dump (ไม่ใช้ Excel ชัยนาท)");
  }

  await assertLegacyLoaded(skipLegacyCheck);
  await truncateAppTables(scopes);

  let maps: Awaited<ReturnType<typeof importCore>> | null = null;
  if (scopes.has("core")) {
    console.log("Importing core...");
    maps = await importCore(legacyMaster);
    console.log("Core import done.");
  }
  if (scopes.has("bookregister")) {
    if (!maps) {
      console.error("bookregister scope requires core maps. Include core in --scope.");
      process.exit(1);
    }
    console.log("Importing bookregister...");
    await importBookregister(maps);
    console.log("Bookregister import done.");
  }
  if (scopes.has("mail")) {
    if (!maps) {
      console.error("mail scope requires core maps. Include core in --scope.");
      process.exit(1);
    }
    console.log("Importing mail...");
    await importMail(maps);
    console.log("Mail import done.");
  }
  if (scopes.has("book")) {
    if (!maps) {
      console.error("book scope requires core maps. Include core in --scope.");
      process.exit(1);
    }
    console.log("Importing book...");
    await importBook(maps);
    console.log("Book import done.");
  }
  if (scopes.has("leave")) {
    if (!maps) {
      console.log("leave scope: building maps from existing DB...");
      maps = await buildMapsFromDb();
    }
    console.log("Importing leave...");
    const leaveResult = await importLeave(maps);
    console.log(
      `Leave import done — people backfilled: ${leaveResult.peopleBackfilled}, ` +
        `names refreshed: ${leaveResult.peopleNamesRefreshed}, ` +
        `requests: ${leaveResult.requestsInserted} inserted, ` +
        `${leaveResult.requestsSkippedExisting} skipped (existing), ` +
        `${leaveResult.requestsSkippedNoPerson} skipped (no person); ` +
        `cancellations: ${leaveResult.cancellationsInserted} inserted.`,
    );
  }

  console.log("Import complete.");
  await queryClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
