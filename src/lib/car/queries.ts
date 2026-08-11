import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import {
  fuelLabel,
  grantStatusLabel,
  permissionRoleLabel,
  vehicleStatusLabel,
} from "@/lib/car/constants";
import { db } from "@/lib/db";
import {
  carDrivers,
  carPermissions,
  carRequests,
  carTypes,
  carVehicles,
  people,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 25;

export type CarRequestListRow = {
  id: number;
  personId: string;
  displayName: string;
  carLabel: string;
  place: string;
  carStart: string;
  carFinish: string;
  dayTotal: number | null;
  commanderGrant: number | null;
  grantStatusLabel: string;
  createdAt: Date;
};

export type CarRequestDetail = {
  id: number;
  personId: string;
  displayName: string;
  recDate: string;
  carCode: number;
  carLabel: string;
  place: string;
  because: string;
  carStart: string;
  carFinish: string;
  timeStart: number | null;
  timeFinish: number | null;
  dayTotal: number | null;
  personNum: number | null;
  controlPerson: string | null;
  fuel: number;
  project: string | null;
  activity: string | null;
  money: number | null;
  driverPersonId: string | null;
  officerComment: string | null;
  officerDate: Date | null;
  groupComment: string | null;
  groupDate: Date | null;
  grantComment: string | null;
  commanderGrant: number | null;
  commanderDate: Date | null;
  createdAt: Date;
};

export type CarVehicleRow = {
  id: number;
  carCode: number;
  carTypeCode: number;
  typeName: string | null;
  carNumber: string;
  name: string;
  status: number;
  statusLabel: string;
  pic: string | null;
};

export type CarDriverRow = {
  id: number;
  personId: string;
  displayName: string;
  status: number;
  recDate: string | null;
};

export type CarTypeRow = {
  id: number;
  code: number;
  name: string;
};

export type CarPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  roleLabel: string;
  officerPersonId: string | null;
  displayName: string;
};

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export type BookableVehicleOption = {
  carCode: number;
  label: string;
};

function buildRequestWhere(
  q: string,
  grant: "all" | "pending" | "approved" | "rejected",
) {
  const conditions: (SQL | undefined)[] = [];

  if (q.length >= 2) {
    conditions.push(
      or(
        like(carRequests.personId, `%${q}%`),
        like(people.firstName, `%${q}%`),
        like(people.lastName, `%${q}%`),
        like(people.prefix, `%${q}%`),
        like(carRequests.place, `%${q}%`),
      ),
    );
  }

  if (grant === "pending") conditions.push(isNull(carRequests.commanderGrant));
  if (grant === "approved") conditions.push(eq(carRequests.commanderGrant, 1));
  if (grant === "rejected") conditions.push(eq(carRequests.commanderGrant, 0));

  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseCarListParams(params: {
  page?: string;
  q?: string;
  grant?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const grant: "all" | "pending" | "approved" | "rejected" =
    params.grant === "pending" ||
    params.grant === "approved" ||
    params.grant === "rejected"
      ? params.grant
      : "all";
  return { page, q, grant };
}

export async function resolveCarListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countCarRequests(
  q: string,
  grant: "all" | "pending" | "approved" | "rejected",
): Promise<number> {
  const where = buildRequestWhere(q, grant);
  const query = db
    .select({ total: count() })
    .from(carRequests)
    .leftJoin(people, eq(people.personId, carRequests.personId));

  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

export async function listCarRequestsPage(input: {
  page: number;
  q: string;
  grant: "all" | "pending" | "approved" | "rejected";
}): Promise<CarRequestListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildRequestWhere(input.q, input.grant);

  const base = db
    .select({
      id: carRequests.id,
      personId: carRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      carCode: carRequests.carCode,
      carNumber: carVehicles.carNumber,
      carName: carVehicles.name,
      place: carRequests.place,
      carStart: carRequests.carStart,
      carFinish: carRequests.carFinish,
      dayTotal: carRequests.dayTotal,
      commanderGrant: carRequests.commanderGrant,
      createdAt: carRequests.createdAt,
    })
    .from(carRequests)
    .leftJoin(people, eq(people.personId, carRequests.personId))
    .leftJoin(carVehicles, eq(carVehicles.carCode, carRequests.carCode))
    .orderBy(desc(carRequests.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    carLabel: row.carNumber
      ? `${row.carNumber} ${row.carName ?? ""}`.trim()
      : `รหัส ${row.carCode}`,
    place: row.place,
    carStart: row.carStart,
    carFinish: row.carFinish,
    dayTotal: row.dayTotal,
    commanderGrant: row.commanderGrant,
    grantStatusLabel: grantStatusLabel(row.commanderGrant),
    createdAt: row.createdAt,
  }));
}

export async function getCarRequest(id: number): Promise<CarRequestDetail | null> {
  const [row] = await db
    .select({
      id: carRequests.id,
      personId: carRequests.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      recDate: carRequests.recDate,
      carCode: carRequests.carCode,
      carNumber: carVehicles.carNumber,
      carName: carVehicles.name,
      place: carRequests.place,
      because: carRequests.because,
      carStart: carRequests.carStart,
      carFinish: carRequests.carFinish,
      timeStart: carRequests.timeStart,
      timeFinish: carRequests.timeFinish,
      dayTotal: carRequests.dayTotal,
      personNum: carRequests.personNum,
      controlPerson: carRequests.controlPerson,
      fuel: carRequests.fuel,
      project: carRequests.project,
      activity: carRequests.activity,
      money: carRequests.money,
      driverPersonId: carRequests.driverPersonId,
      officerComment: carRequests.officerComment,
      officerDate: carRequests.officerDate,
      groupComment: carRequests.groupComment,
      groupDate: carRequests.groupDate,
      grantComment: carRequests.grantComment,
      commanderGrant: carRequests.commanderGrant,
      commanderDate: carRequests.commanderDate,
      createdAt: carRequests.createdAt,
    })
    .from(carRequests)
    .leftJoin(people, eq(people.personId, carRequests.personId))
    .leftJoin(carVehicles, eq(carVehicles.carCode, carRequests.carCode))
    .where(eq(carRequests.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    recDate: row.recDate,
    carCode: row.carCode,
    carLabel: row.carNumber
      ? `${row.carNumber} ${row.carName ?? ""}`.trim()
      : `รหัส ${row.carCode}`,
    place: row.place,
    because: row.because,
    carStart: row.carStart,
    carFinish: row.carFinish,
    timeStart: row.timeStart,
    timeFinish: row.timeFinish,
    dayTotal: row.dayTotal,
    personNum: row.personNum,
    controlPerson: row.controlPerson,
    fuel: row.fuel,
    project: row.project,
    activity: row.activity,
    money: row.money,
    driverPersonId: row.driverPersonId,
    officerComment: row.officerComment,
    officerDate: row.officerDate,
    groupComment: row.groupComment,
    groupDate: row.groupDate,
    grantComment: row.grantComment,
    commanderGrant: row.commanderGrant,
    commanderDate: row.commanderDate,
    createdAt: row.createdAt,
  };
}

export async function listCarVehicles(): Promise<CarVehicleRow[]> {
  const rows = await db
    .select({
      id: carVehicles.id,
      carCode: carVehicles.carCode,
      carTypeCode: carVehicles.carTypeCode,
      typeName: carTypes.name,
      carNumber: carVehicles.carNumber,
      name: carVehicles.name,
      status: carVehicles.status,
      pic: carVehicles.pic,
    })
    .from(carVehicles)
    .leftJoin(carTypes, eq(carTypes.code, carVehicles.carTypeCode))
    .orderBy(asc(carVehicles.carTypeCode), asc(carVehicles.carCode));

  return rows.map((row) => ({
    ...row,
    statusLabel: vehicleStatusLabel(row.status),
  }));
}

export async function getCarVehicle(id: number) {
  const [row] = await db
    .select()
    .from(carVehicles)
    .where(eq(carVehicles.id, id))
    .limit(1);
  return row ?? null;
}

export async function listBookableVehicles(): Promise<BookableVehicleOption[]> {
  const rows = await db
    .select({
      carCode: carVehicles.carCode,
      carNumber: carVehicles.carNumber,
      name: carVehicles.name,
    })
    .from(carVehicles)
    .where(eq(carVehicles.status, 2))
    .orderBy(asc(carVehicles.carCode));

  return rows.map((row) => ({
    carCode: row.carCode,
    label: `${row.carNumber} ${row.name}`.trim(),
  }));
}

export async function listCarDrivers(): Promise<CarDriverRow[]> {
  const rows = await db
    .select({
      id: carDrivers.id,
      personId: carDrivers.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      status: carDrivers.status,
      recDate: carDrivers.recDate,
    })
    .from(carDrivers)
    .leftJoin(people, eq(people.personId, carDrivers.personId))
    .orderBy(asc(carDrivers.id));

  return rows.map((row) => ({
    id: row.id,
    personId: row.personId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
    status: row.status,
    recDate: row.recDate,
  }));
}

export async function getCarDriver(id: number) {
  const [row] = await db
    .select()
    .from(carDrivers)
    .where(eq(carDrivers.id, id))
    .limit(1);
  return row ?? null;
}

export async function listCarTypes(): Promise<CarTypeRow[]> {
  return db
    .select({
      id: carTypes.id,
      code: carTypes.code,
      name: carTypes.name,
    })
    .from(carTypes)
    .orderBy(asc(carTypes.code));
}

export async function getCarType(id: number) {
  const [row] = await db
    .select()
    .from(carTypes)
    .where(eq(carTypes.id, id))
    .limit(1);
  return row ?? null;
}

export async function listCarPermissions(): Promise<CarPermissionRow[]> {
  const rows = await db
    .select({
      id: carPermissions.id,
      userId: carPermissions.userId,
      personId: users.personId,
      p1: carPermissions.p1,
      officerPersonId: carPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(carPermissions)
    .innerJoin(users, eq(carPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(carPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    roleLabel: permissionRoleLabel(row.p1),
    officerPersonId: row.officerPersonId,
    displayName:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.userName,
      }) || row.userName,
  }));
}

export async function getCarModulePermission(id: number) {
  const rows = await listCarPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getCarPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(carPermissions)
    .where(eq(carPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listDistrictStaffForCarPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: carPermissions.userId })
    .from(carPermissions);

  const existingIds = existing
    .map((r) => r.userId)
    .filter((id) => id !== excludeUserId);

  const conditions = [
    eq(users.organizationType, "district"),
    eq(users.status, 1),
    eq(people.organizationType, "district"),
    eq(people.status, 0),
  ];

  if (existingIds.length > 0) {
    conditions.push(notInArray(users.id, existingIds));
  }

  const rows = await db
    .select({
      userId: users.id,
      personId: users.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(users)
    .innerJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((row) => ({
    userId: row.userId,
    personId: row.personId,
    label:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.userName,
      }) || row.userName,
  }));
}

export async function listActiveDriversForPicker(): Promise<
  { personId: string; label: string }[]
> {
  const rows = await db
    .select({
      personId: carDrivers.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(carDrivers)
    .leftJoin(people, eq(people.personId, carDrivers.personId))
    .where(eq(carDrivers.status, 1))
    .orderBy(asc(people.firstName));

  return rows.map((row) => ({
    personId: row.personId,
    label: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }),
  }));
}

export function fuelLabelForDetail(fuel: number): string {
  return fuelLabel(fuel);
}
