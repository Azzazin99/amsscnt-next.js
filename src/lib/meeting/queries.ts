import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  notInArray,
  type SQL,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { approveStatusLabel, meetingTimeLabel } from "@/lib/meeting/constants";
import { db } from "@/lib/db";
import {
  meetingBookings,
  meetingPermissions,
  meetingRooms,
  people,
  users,
} from "@/lib/db/schema";

export const PAGE_SIZE = 20;

export type MeetingRoomRow = {
  id: number;
  roomCode: number;
  roomName: string;
  active: boolean;
};

export type MeetingBookingListRow = {
  id: number;
  roomCode: number;
  roomName: string;
  bookDate: string;
  bookDateEnd: string;
  startTime: number;
  finishTime: number;
  startTimeLabel: string;
  finishTimeLabel: string;
  objective: string;
  personNum: number | null;
  other: string | null;
  bookPersonId: string;
  displayName: string;
  recDate: Date;
  approve: number | null;
  approveStatusLabel: string;
  reason: string | null;
};

export type MeetingBookingDetail = MeetingBookingListRow;

export type MeetingPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  officerPersonId: string | null;
  displayName: string;
};

export type DistrictStaffOption = {
  userId: number;
  personId: string;
  label: string;
};

function buildBookingsWhere(roomCode: number | null) {
  const conditions: (SQL | undefined)[] = [];
  if (roomCode) conditions.push(eq(meetingBookings.roomCode, roomCode));
  const filtered = conditions.filter(Boolean) as SQL[];
  return filtered.length > 0 ? and(...filtered) : undefined;
}

export function parseMeetingListParams(params: {
  page?: string;
  room?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const roomRaw = Number(params.room);
  const roomCode =
    Number.isFinite(roomRaw) && roomRaw >= 1 ? roomRaw : null;
  return { page, roomCode };
}

export function parseMeetingCalendarParams(params: {
  date?: string;
  room?: string;
}) {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
  const date = (params.date ?? today).trim();
  const roomRaw = Number(params.room);
  const roomCode =
    Number.isFinite(roomRaw) && roomRaw >= 1 ? roomRaw : null;
  return { date, roomCode };
}

export async function resolveMeetingListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function listActiveMeetingRooms(): Promise<MeetingRoomRow[]> {
  return db
    .select({
      id: meetingRooms.id,
      roomCode: meetingRooms.roomCode,
      roomName: meetingRooms.roomName,
      active: meetingRooms.active,
    })
    .from(meetingRooms)
    .where(eq(meetingRooms.active, true))
    .orderBy(asc(meetingRooms.roomCode));
}

export async function listAllMeetingRooms(): Promise<MeetingRoomRow[]> {
  return db
    .select({
      id: meetingRooms.id,
      roomCode: meetingRooms.roomCode,
      roomName: meetingRooms.roomName,
      active: meetingRooms.active,
    })
    .from(meetingRooms)
    .orderBy(asc(meetingRooms.roomCode));
}

export async function getMeetingRoom(id: number) {
  const [row] = await db
    .select()
    .from(meetingRooms)
    .where(eq(meetingRooms.id, id))
    .limit(1);
  return row ?? null;
}

export async function getMeetingRoomNameMap(): Promise<Map<number, string>> {
  const rows = await listAllMeetingRooms();
  return new Map(rows.map((r) => [r.roomCode, r.roomName]));
}

export async function countMeetingBookings(
  roomCode: number | null,
): Promise<number> {
  const where = buildBookingsWhere(roomCode);
  const query = db.select({ total: count() }).from(meetingBookings);
  const [row] = where ? await query.where(where) : await query;
  return Number(row?.total ?? 0);
}

function mapBookingRow(
  row: {
    id: number;
    roomCode: number;
    roomName: string | null;
    bookDate: string;
    bookDateEnd: string;
    startTime: number;
    finishTime: number;
    objective: string;
    personNum: number | null;
    other: string | null;
    bookPersonId: string;
    prefix: string | null;
    firstName: string | null;
    lastName: string | null;
    recDate: Date;
    approve: number | null;
    reason: string | null;
  },
): MeetingBookingListRow {
  return {
    id: row.id,
    roomCode: row.roomCode,
    roomName: row.roomName ?? `ห้อง ${row.roomCode}`,
    bookDate: row.bookDate,
    bookDateEnd: row.bookDateEnd,
    startTime: row.startTime,
    finishTime: row.finishTime,
    startTimeLabel: meetingTimeLabel(row.startTime),
    finishTimeLabel: meetingTimeLabel(row.finishTime),
    objective: row.objective,
    personNum: row.personNum,
    other: row.other,
    bookPersonId: row.bookPersonId,
    displayName: formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.bookPersonId,
    }),
    recDate: row.recDate,
    approve: row.approve,
    approveStatusLabel: approveStatusLabel(row.approve),
    reason: row.reason,
  };
}

export async function listMeetingBookingsPage(input: {
  page: number;
  roomCode: number | null;
}): Promise<MeetingBookingListRow[]> {
  const offset = (input.page - 1) * PAGE_SIZE;
  const where = buildBookingsWhere(input.roomCode);

  const base = db
    .select({
      id: meetingBookings.id,
      roomCode: meetingBookings.roomCode,
      roomName: meetingRooms.roomName,
      bookDate: meetingBookings.bookDate,
      bookDateEnd: meetingBookings.bookDateEnd,
      startTime: meetingBookings.startTime,
      finishTime: meetingBookings.finishTime,
      objective: meetingBookings.objective,
      personNum: meetingBookings.personNum,
      other: meetingBookings.other,
      bookPersonId: meetingBookings.bookPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      recDate: meetingBookings.recDate,
      approve: meetingBookings.approve,
      reason: meetingBookings.reason,
    })
    .from(meetingBookings)
    .leftJoin(meetingRooms, eq(meetingRooms.roomCode, meetingBookings.roomCode))
    .leftJoin(people, eq(people.personId, meetingBookings.bookPersonId))
    .orderBy(
      asc(meetingBookings.bookDate),
      asc(meetingBookings.roomCode),
      asc(meetingBookings.startTime),
    )
    .limit(PAGE_SIZE)
    .offset(offset);

  const rows = where ? await base.where(where) : await base;
  return rows.map(mapBookingRow);
}

export async function listMeetingBookingsByDate(input: {
  date: string;
  roomCode: number | null;
}): Promise<MeetingBookingListRow[]> {
  const conditions: (SQL | undefined)[] = [
    lte(meetingBookings.bookDate, input.date),
    gte(meetingBookings.bookDateEnd, input.date),
  ];
  if (input.roomCode) {
    conditions.push(eq(meetingBookings.roomCode, input.roomCode));
  }

  const rows = await db
    .select({
      id: meetingBookings.id,
      roomCode: meetingBookings.roomCode,
      roomName: meetingRooms.roomName,
      bookDate: meetingBookings.bookDate,
      bookDateEnd: meetingBookings.bookDateEnd,
      startTime: meetingBookings.startTime,
      finishTime: meetingBookings.finishTime,
      objective: meetingBookings.objective,
      personNum: meetingBookings.personNum,
      other: meetingBookings.other,
      bookPersonId: meetingBookings.bookPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      recDate: meetingBookings.recDate,
      approve: meetingBookings.approve,
      reason: meetingBookings.reason,
    })
    .from(meetingBookings)
    .leftJoin(meetingRooms, eq(meetingRooms.roomCode, meetingBookings.roomCode))
    .leftJoin(people, eq(people.personId, meetingBookings.bookPersonId))
    .where(and(...conditions))
    .orderBy(
      asc(meetingBookings.roomCode),
      asc(meetingBookings.startTime),
    );

  return rows.map(mapBookingRow);
}

export async function getMeetingBooking(
  id: number,
): Promise<MeetingBookingDetail | null> {
  const [row] = await db
    .select({
      id: meetingBookings.id,
      roomCode: meetingBookings.roomCode,
      roomName: meetingRooms.roomName,
      bookDate: meetingBookings.bookDate,
      bookDateEnd: meetingBookings.bookDateEnd,
      startTime: meetingBookings.startTime,
      finishTime: meetingBookings.finishTime,
      objective: meetingBookings.objective,
      personNum: meetingBookings.personNum,
      other: meetingBookings.other,
      bookPersonId: meetingBookings.bookPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      recDate: meetingBookings.recDate,
      approve: meetingBookings.approve,
      reason: meetingBookings.reason,
    })
    .from(meetingBookings)
    .leftJoin(meetingRooms, eq(meetingRooms.roomCode, meetingBookings.roomCode))
    .leftJoin(people, eq(people.personId, meetingBookings.bookPersonId))
    .where(eq(meetingBookings.id, id))
    .limit(1);

  if (!row) return null;
  return mapBookingRow(row);
}

export async function listMeetingPermissions(): Promise<MeetingPermissionRow[]> {
  const rows = await db
    .select({
      id: meetingPermissions.id,
      userId: meetingPermissions.userId,
      personId: users.personId,
      p1: meetingPermissions.p1,
      officerPersonId: meetingPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(meetingPermissions)
    .innerJoin(users, eq(meetingPermissions.userId, users.id))
    .leftJoin(
      people,
      and(
        eq(people.personId, users.personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .where(eq(users.organizationType, "district"))
    .orderBy(asc(meetingPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
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

export async function getMeetingModulePermission(id: number) {
  const rows = await listMeetingPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getMeetingPermissionByUserId(userId: number) {
  const [row] = await db
    .select()
    .from(meetingPermissions)
    .where(eq(meetingPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listDistrictStaffForMeetingPicker(
  excludeUserId?: number,
): Promise<DistrictStaffOption[]> {
  const existing = await db
    .select({ userId: meetingPermissions.userId })
    .from(meetingPermissions);

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
