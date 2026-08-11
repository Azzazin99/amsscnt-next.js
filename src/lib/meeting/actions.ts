"use server";

import { insertAndGetId } from "../db/helpers";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canApproveMeeting,
  canManageMeetingSettings,
  getMeetingPermissions,
} from "@/lib/meeting/permissions";
import {
  getMeetingBooking,
  getMeetingModulePermission,
  getMeetingPermissionByUserId,
  getMeetingRoom,
} from "@/lib/meeting/queries";
import {
  meetingApproveSchema,
  meetingBookingCreateSchema,
  meetingPermissionFormSchema,
  meetingRoomFormSchema,
} from "@/lib/meeting/schemas";
import {
  requireMeetingScope,
  requireMeetingWriteAccess,
} from "@/lib/meeting/scope";
import { db } from "@/lib/db";
import {
  meetingBookings,
  meetingPermissions,
  meetingRooms,
  users,
} from "@/lib/db/schema";

const BOOKINGS_PATH = "/modules/meeting/bookings";
const CALENDAR_PATH = "/modules/meeting/calendar";
const ROOMS_PATH = "/modules/meeting/rooms";
const PERMS_PATH = "/modules/meeting/permissions";

async function requireMeetingSettingsAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!canManageMeetingSettings(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าระบบจองห้องประชุม");
  }

  return session.user;
}

async function requireMeetingApproveAccess() {
  const ctx = await requireMeetingScope();
  if (!canApproveMeeting(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์อนุมัติการจองห้องประชุม");
  }
  return ctx;
}

export async function createMeetingBooking(formData: FormData) {
  const { user } = await requireMeetingWriteAccess();

  const parsed = meetingBookingCreateSchema.safeParse({
    roomCode: formData.get("roomCode"),
    bookDate: formData.get("bookDate"),
    bookDateEnd: formData.get("bookDateEnd"),
    startTime: formData.get("startTime"),
    finishTime: formData.get("finishTime"),
    objective: formData.get("objective"),
    personNum: formData.get("personNum"),
    other: formData.get("other"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;

  const [room] = await db
    .select({ active: meetingRooms.active })
    .from(meetingRooms)
    .where(
      and(
        eq(meetingRooms.roomCode, data.roomCode),
        eq(meetingRooms.active, true),
      ),
    )
    .limit(1);

  if (!room) {
    return { ok: false as const, message: "ห้องประชุมไม่พร้อมใช้งาน" };
  }

  const insertedId = await insertAndGetId(meetingBookings, {
      roomCode: data.roomCode,
      bookDate: data.bookDate,
      bookDateEnd: data.bookDateEnd,
      startTime: data.startTime,
      finishTime: data.finishTime,
      objective: data.objective,
      personNum: data.personNum,
      other: data.other,
      bookPersonId: user.personId,
    });
  const inserted = { id: insertedId };

  revalidatePath(BOOKINGS_PATH);
  revalidatePath(CALENDAR_PATH);
  redirect(`${BOOKINGS_PATH}/${inserted.id}`);
}

export async function approveMeetingBooking(id: number, formData: FormData) {
  const { user } = await requireMeetingApproveAccess();

  const booking = await getMeetingBooking(id);
  if (!booking) return { ok: false as const, message: "ไม่พบรายการจอง" };
  if (booking.approve !== null) {
    return { ok: false as const, message: "รายการนี้พิจารณาแล้ว" };
  }

  const parsed = meetingApproveSchema.safeParse({
    approve: formData.get("approve"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(meetingBookings)
    .set({
      approve: parsed.data.approve,
      reason: parsed.data.reason,
      officerPersonId: user.personId,
      officerDate: new Date(),
    })
    .where(eq(meetingBookings.id, id));

  revalidatePath(BOOKINGS_PATH);
  revalidatePath(CALENDAR_PATH);
  revalidatePath(`${BOOKINGS_PATH}/${id}`);
  redirect(`${BOOKINGS_PATH}/${id}`);
}

export async function deleteMeetingBooking(id: number) {
  const { user } = await requireMeetingScope();

  const booking = await getMeetingBooking(id);
  if (!booking) return { ok: false as const, message: "ไม่พบรายการจอง" };

  const canDelete =
    booking.bookPersonId === user.personId ||
    canManageMeetingSettings(user) ||
    (await getMeetingPermissions(Number(user.id))).p1 === 1;

  if (!canDelete) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.delete(meetingBookings).where(eq(meetingBookings.id, id));

  revalidatePath(BOOKINGS_PATH);
  revalidatePath(CALENDAR_PATH);
  redirect(BOOKINGS_PATH);
}

export async function updateMeetingRoom(id: number, formData: FormData) {
  await requireMeetingSettingsAccess();
  const existing = await getMeetingRoom(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูลห้องประชุม" };

  const parsed = meetingRoomFormSchema.safeParse({
    roomName: formData.get("roomName"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(meetingRooms)
    .set({
      roomName: parsed.data.roomName,
      active: parsed.data.active,
    })
    .where(eq(meetingRooms.id, id));

  revalidatePath(ROOMS_PATH);
  revalidatePath(BOOKINGS_PATH);
  revalidatePath(CALENDAR_PATH);
  redirect(ROOMS_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = meetingPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    officerPersonId: formData.get("officerPersonId"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return Boolean(user && user.organizationType === "district");
}

export async function createMeetingPermission(formData: FormData) {
  await requireMeetingSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getMeetingPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(meetingPermissions).values({
    userId,
    p1: p1 ? 1 : 0,
    officerPersonId,
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateMeetingPermission(id: number, formData: FormData) {
  await requireMeetingSettingsAccess();
  const row = await getMeetingModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getMeetingPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(meetingPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      officerPersonId,
    })
    .where(eq(meetingPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteMeetingPermission(id: number) {
  await requireMeetingSettingsAccess();
  await db.delete(meetingPermissions).where(eq(meetingPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
