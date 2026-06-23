import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  districtSettings,
  moduleAdmins,
  people,
  personSchoolAssignments,
  schools,
  users,
} from "@/lib/db/schema";
import type { AmssSessionUser, SchoolChoice } from "@/types/next-auth";
import { normalizeModuleSlug } from "@/lib/modules/normalize-module-slug";
import {
  districtLoginStatus,
  schoolLoginStatus,
} from "@/lib/auth/login-status";

export type LoginVerifyResult =
  | { ok: true; profile: AmssSessionUser }
  | {
      ok: false;
      code:
        | "INVALID_CREDENTIALS"
        | "NOT_FOUND"
        | "NOT_STAFF"
        | "USER_EXISTS"
        | "NEEDS_SCHOOL"
        | "INVALID_SCHOOL";
      message: string;
      schools?: SchoolChoice[];
    };

const THIRTEEN_DIGIT = /^\d{13}$/;

async function loadOffice() {
  const [row] = await db.select().from(districtSettings).limit(1);
  return {
    officeCode: row?.officeCode ?? process.env.AMSS_OFFICE_CODE ?? "1701",
    officeName:
      row?.officeName ??
      process.env.AMSS_DISTRICT_NAME ??
      "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท",
  };
}

async function loadModuleAdmins(userId: number) {
  const rows = await db
    .select({ slug: moduleAdmins.moduleSlug })
    .from(moduleAdmins)
    .where(eq(moduleAdmins.userId, userId));
  return rows.map((r) => normalizeModuleSlug(r.slug));
}

async function loadSchoolChoices(personId: string): Promise<SchoolChoice[]> {
  const assignments = await db
    .select({
      schoolCode: schools.schoolCode,
      schoolName: schools.name,
    })
    .from(personSchoolAssignments)
    .innerJoin(schools, eq(personSchoolAssignments.schoolId, schools.id))
    .where(eq(personSchoolAssignments.personId, personId));

  if (assignments.length > 0) return assignments;

  const [person] = await db
    .select({ schoolId: people.schoolId })
    .from(people)
    .where(
      and(
        eq(people.personId, personId),
        eq(people.organizationType, "school"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  if (!person?.schoolId) return [];

  const [school] = await db
    .select({ schoolCode: schools.schoolCode, schoolName: schools.name })
    .from(schools)
    .where(eq(schools.id, person.schoolId))
    .limit(1);

  return school ? [{ schoolCode: school.schoolCode, schoolName: school.schoolName }] : [];
}

async function resolveSchoolContext(
  personId: string,
  schoolCode: string,
): Promise<{
  userSchoolCode: string;
  userSchoolName: string;
  userSchoolType: number;
} | null> {
  const allowed = await loadSchoolChoices(personId);
  const match = allowed.find((s) => s.schoolCode === schoolCode);
  if (!match) return null;

  const [school] = await db
    .select({
      schoolCode: schools.schoolCode,
      schoolName: schools.name,
      schoolType: schools.schoolType,
    })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);

  if (!school) return null;

  return {
    userSchoolCode: school.schoolCode,
    userSchoolName: school.schoolName,
    userSchoolType: school.schoolType,
  };
}

async function buildDistrictProfile(
  base: Omit<
    AmssSessionUser,
    | "loginStatus"
    | "loginWorkgroup"
    | "userSchoolCode"
    | "userSchoolName"
    | "userSchoolType"
    | "organizationType"
    | "firstTimeLogin"
  >,
  personId: string,
  loginStatus: number,
  firstTimeLogin: boolean,
): Promise<AmssSessionUser> {
  const [person] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.personId, personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  return {
    ...base,
    loginStatus,
    loginWorkgroup: person?.workgroupId ?? null,
    userSchoolCode: null,
    userSchoolName: null,
    userSchoolType: null,
    organizationType: "district",
    firstTimeLogin,
    prefix: person?.prefix ?? null,
    firstName: person?.firstName ?? null,
    lastName: person?.lastName ?? null,
  };
}

async function buildSchoolProfile(
  base: Omit<
    AmssSessionUser,
    | "loginStatus"
    | "loginWorkgroup"
    | "userSchoolCode"
    | "userSchoolName"
    | "userSchoolType"
    | "organizationType"
    | "firstTimeLogin"
    | "prefix"
    | "firstName"
    | "lastName"
  >,
  personId: string,
  schoolCode: string | undefined,
  firstTimeLogin: boolean,
): Promise<LoginVerifyResult> {
  const [person] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.personId, personId),
        eq(people.organizationType, "school"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  if (!person) {
    return {
      ok: false,
      code: "NOT_STAFF",
      message: "คุณไม่ได้เป็นบุคลากรปัจจุบันของหน่วยงาน จึงไม่ได้รับสิทธิ์ใช้งาน",
    };
  }

  if (person.multiSchool && !schoolCode && !firstTimeLogin) {
    const schoolsList = await loadSchoolChoices(personId);
    return {
      ok: false,
      code: "NEEDS_SCHOOL",
      message: "กรุณาเลือกสถานศึกษาสำหรับปฏิบัติงาน",
      schools: schoolsList,
    };
  }

  let resolvedCode = schoolCode;
  if (!resolvedCode && person.schoolId) {
    const [primary] = await db
      .select({ schoolCode: schools.schoolCode })
      .from(schools)
      .where(eq(schools.id, person.schoolId))
      .limit(1);
    resolvedCode = primary?.schoolCode;
  }

  if (!resolvedCode) {
    return {
      ok: false,
      code: "INVALID_SCHOOL",
      message: "ไม่พบข้อมูลสถานศึกษา",
    };
  }

  const schoolCtx = await resolveSchoolContext(personId, resolvedCode);
  if (!schoolCtx) {
    return {
      ok: false,
      code: "INVALID_SCHOOL",
      message: "สถานศึกษาที่เลือกไม่ถูกต้อง",
    };
  }

  const loginStatus = firstTimeLogin
    ? 15
    : schoolLoginStatus(person.positionCode ?? 0);

  return {
    ok: true,
    profile: {
      ...base,
      loginStatus,
      loginWorkgroup: null,
      userSchoolCode: schoolCtx.userSchoolCode,
      userSchoolName: schoolCtx.userSchoolName,
      userSchoolType: schoolCtx.userSchoolType,
      organizationType: "school",
      firstTimeLogin,
      prefix: person.prefix,
      firstName: person.firstName,
      lastName: person.lastName,
    },
  };
}

export async function verifyLogin(input: {
  username: string;
  password: string;
  schoolCode?: string;
}): Promise<LoginVerifyResult> {
  const username = input.username.trim();
  const password = input.password;
  const schoolCode = input.schoolCode?.trim() || undefined;

  if (!username) {
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "กรุณากรอกชื่อผู้ใช้",
    };
  }

  const office = await loadOffice();

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, username), eq(users.status, 1)))
    .limit(1);

  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return {
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Password ไม่ถูกต้อง",
      };
    }

    const moduleAdminSlugs = await loadModuleAdmins(user.id);

    const base = {
      id: String(user.id),
      username: user.username,
      personId: user.personId,
      officeCode: office.officeCode,
      officeName: office.officeName,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      moduleAdmins: moduleAdminSlugs,
      prefix: null as string | null,
      firstName: null as string | null,
      lastName: null as string | null,
      loginStatus: 0,
      loginWorkgroup: null as number | null,
      userSchoolCode: null as string | null,
      userSchoolName: null as string | null,
      userSchoolType: null as number | null,
      organizationType: "district" as const,
      firstTimeLogin: false,
    };

    if (user.username === "admin" || user.isSuperAdmin) {
      return {
        ok: true,
        profile: {
          ...base,
          loginStatus: 99,
          loginWorkgroup: null,
          userSchoolCode: null,
          userSchoolName: null,
          userSchoolType: null,
          organizationType: user.organizationType,
          firstTimeLogin: false,
          prefix: null,
          firstName: "admin",
          lastName: null,
        },
      };
    }

    const [districtPerson] = await db
      .select()
      .from(people)
      .where(
        and(
          eq(people.personId, user.personId),
          eq(people.organizationType, "district"),
          eq(people.status, 0),
        ),
      )
      .limit(1);

    if (districtPerson) {
      return {
        ok: true,
        profile: await buildDistrictProfile(
          base,
          user.personId,
          districtLoginStatus(districtPerson.positionCode ?? 0),
          false,
        ),
      };
    }

    return buildSchoolProfile(base, user.personId, schoolCode, false);
  }

  if (!THIRTEEN_DIGIT.test(username)) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "ไม่พบชื่ออยู่ในระบบ",
    };
  }

  const existingByPerson = await db
    .select({ username: users.username })
    .from(users)
    .where(and(eq(users.personId, username), eq(users.status, 1)))
    .limit(1);

  if (existingByPerson.length > 0) {
    return {
      ok: false,
      code: "USER_EXISTS",
      message:
        "คุณมีชื่อผู้ใช้อยู่แล้ว กรุณา login ด้วย Username และ Password",
    };
  }

  const [districtPerson] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.personId, username),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  if (districtPerson) {
    const base = {
      id: username,
      username,
      personId: username,
      officeCode: office.officeCode,
      officeName: office.officeName,
      isSuperAdmin: false,
      isAdmin: false,
      moduleAdmins: [] as string[],
      prefix: null as string | null,
      firstName: null as string | null,
      lastName: null as string | null,
    };

    return {
      ok: true,
      profile: await buildDistrictProfile(base, username, 5, true),
    };
  }

  const [schoolPerson] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.personId, username),
        eq(people.organizationType, "school"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  if (schoolPerson) {
    const base = {
      id: username,
      username,
      personId: username,
      officeCode: office.officeCode,
      officeName: office.officeName,
      isSuperAdmin: false,
      isAdmin: false,
      moduleAdmins: [] as string[],
      prefix: null as string | null,
      firstName: null as string | null,
      lastName: null as string | null,
    };

    const result = await buildSchoolProfile(base, username, schoolCode, true);
    return result;
  }

  return {
    ok: false,
    code: "NOT_STAFF",
    message: "ไม่พบชื่ออยู่ในระบบ",
  };
}
