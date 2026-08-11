"use server";

import { insertAndGetId } from "../db/helpers";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeDayTotal } from "@/lib/car/constants";
import {
  canApproveCar,
  getCarPermissions,
} from "@/lib/car/permissions";
import {
  getCarDriver,
  getCarModulePermission,
  getCarPermissionByUserId,
  getCarRequest,
  getCarType,
  getCarVehicle,
} from "@/lib/car/queries";
import {
  carApproveSchema,
  carDriverFormSchema,
  carPermissionFormSchema,
  carRequestCreateSchema,
  carTypeFormSchema,
  carVehicleFormSchema,
} from "@/lib/car/schemas";
import {
  requireCarScope,
  requireCarSettingsAccess,
  requireCarWriteAccess,
} from "@/lib/car/scope";
import { db } from "@/lib/db";
import {
  carDrivers,
  carPermissions,
  carRequests,
  carTypes,
  carVehicles,
  users,
} from "@/lib/db/schema";

const REQUESTS_PATH = "/modules/car/requests";
const VEHICLES_PATH = "/modules/car/vehicles";
const DRIVERS_PATH = "/modules/car/drivers";
const TYPES_PATH = "/modules/car/types";
const PERMS_PATH = "/modules/car/permissions";

async function requireCarApproveAccess() {
  const ctx = await requireCarScope();
  if (!canApproveCar(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์อนุมัติคำขอใช้ยานพาหนะ");
  }
  return ctx;
}

function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export async function createCarRequest(formData: FormData) {
  const { user } = await requireCarWriteAccess();

  const parsed = carRequestCreateSchema.safeParse({
    carCode: formData.get("carCode"),
    place: formData.get("place"),
    because: formData.get("because"),
    carStart: formData.get("carStart"),
    carFinish: formData.get("carFinish"),
    timeStart: formData.get("timeStart"),
    timeFinish: formData.get("timeFinish"),
    personNum: formData.get("personNum"),
    controlPerson: formData.get("controlPerson"),
    fuel: formData.get("fuel"),
    project: formData.get("project"),
    activity: formData.get("activity"),
    money: formData.get("money"),
    driverPersonId: formData.get("driverPersonId"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const dayTotal = computeDayTotal(data.carStart, data.carFinish);

  const insertedId = await insertAndGetId(carRequests, {
      personId: user.personId,
      recDate: todayDateString(),
      carCode: data.carCode,
      place: data.place,
      because: data.because,
      carStart: data.carStart,
      carFinish: data.carFinish,
      timeStart: data.timeStart,
      timeFinish: data.timeFinish,
      dayTotal,
      personNum: data.personNum,
      controlPerson: data.controlPerson,
      fuel: data.fuel,
      project: data.project,
      activity: data.activity,
      money: data.money,
      driverPersonId: data.driverPersonId,
    });
  const inserted = { id: insertedId };

  revalidatePath(REQUESTS_PATH);
  redirect(`${REQUESTS_PATH}/${inserted.id}`);
}

export async function approveCarRequest(id: number, formData: FormData) {
  const { user } = await requireCarApproveAccess();

  const request = await getCarRequest(id);
  if (!request) return { ok: false as const, message: "ไม่พบคำขอ" };
  if (request.commanderGrant !== null) {
    return { ok: false as const, message: "คำขอนี้พิจารณาแล้ว" };
  }

  const parsed = carApproveSchema.safeParse({
    commanderGrant: formData.get("commanderGrant"),
    grantComment: formData.get("grantComment"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(carRequests)
    .set({
      commanderGrant: parsed.data.commanderGrant,
      grantComment: parsed.data.grantComment,
      commanderSignPersonId: user.personId,
      commanderDate: new Date(),
    })
    .where(eq(carRequests.id, id));

  revalidatePath(REQUESTS_PATH);
  revalidatePath(`${REQUESTS_PATH}/${id}`);
  redirect(`${REQUESTS_PATH}/${id}`);
}

export async function createCarVehicle(formData: FormData) {
  await requireCarSettingsAccess();
  const parsed = carVehicleFormSchema.safeParse({
    carCode: formData.get("carCode"),
    carTypeCode: formData.get("carTypeCode"),
    carNumber: formData.get("carNumber"),
    name: formData.get("name"),
    status: formData.get("status"),
    pic: formData.get("pic"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db.insert(carVehicles).values(parsed.data);
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — รหัสอาจซ้ำ" };
  }

  revalidatePath(VEHICLES_PATH);
  redirect(VEHICLES_PATH);
}

export async function updateCarVehicle(id: number, formData: FormData) {
  await requireCarSettingsAccess();
  const existing = await getCarVehicle(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = carVehicleFormSchema.safeParse({
    carCode: formData.get("carCode"),
    carTypeCode: formData.get("carTypeCode"),
    carNumber: formData.get("carNumber"),
    name: formData.get("name"),
    status: formData.get("status"),
    pic: formData.get("pic"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db
      .update(carVehicles)
      .set(parsed.data)
      .where(eq(carVehicles.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — รหัสอาจซ้ำ" };
  }

  revalidatePath(VEHICLES_PATH);
  redirect(VEHICLES_PATH);
}

export async function deleteCarVehicle(id: number) {
  await requireCarSettingsAccess();
  await db.delete(carVehicles).where(eq(carVehicles.id, id));
  revalidatePath(VEHICLES_PATH);
  redirect(VEHICLES_PATH);
}

export async function createCarDriver(formData: FormData) {
  const { user } = await requireCarSettingsAccess();
  const parsed = carDriverFormSchema.safeParse({
    personId: formData.get("personId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db.insert(carDrivers).values({
    personId: parsed.data.personId,
    status: parsed.data.status,
    officerPersonId: user.personId,
    recDate: todayDateString(),
  });

  revalidatePath(DRIVERS_PATH);
  redirect(DRIVERS_PATH);
}

export async function updateCarDriver(id: number, formData: FormData) {
  await requireCarSettingsAccess();
  const existing = await getCarDriver(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = carDriverFormSchema.safeParse({
    personId: formData.get("personId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(carDrivers)
    .set({
      personId: parsed.data.personId,
      status: parsed.data.status,
    })
    .where(eq(carDrivers.id, id));

  revalidatePath(DRIVERS_PATH);
  redirect(DRIVERS_PATH);
}

export async function deleteCarDriver(id: number) {
  await requireCarSettingsAccess();
  await db.delete(carDrivers).where(eq(carDrivers.id, id));
  revalidatePath(DRIVERS_PATH);
  redirect(DRIVERS_PATH);
}

export async function createCarType(formData: FormData) {
  await requireCarSettingsAccess();
  const parsed = carTypeFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db.insert(carTypes).values(parsed.data);
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — รหัสอาจซ้ำ" };
  }

  revalidatePath(TYPES_PATH);
  revalidatePath(VEHICLES_PATH);
  redirect(TYPES_PATH);
}

export async function updateCarType(id: number, formData: FormData) {
  await requireCarSettingsAccess();
  const existing = await getCarType(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = carTypeFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await db.update(carTypes).set(parsed.data).where(eq(carTypes.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — รหัสอาจซ้ำ" };
  }

  revalidatePath(TYPES_PATH);
  revalidatePath(VEHICLES_PATH);
  redirect(TYPES_PATH);
}

export async function deleteCarType(id: number) {
  await requireCarSettingsAccess();
  await db.delete(carTypes).where(eq(carTypes.id, id));
  revalidatePath(TYPES_PATH);
  revalidatePath(VEHICLES_PATH);
  redirect(TYPES_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = carPermissionFormSchema.safeParse({
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

export async function createCarPermission(formData: FormData) {
  await requireCarSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getCarPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(carPermissions).values({ userId, p1, officerPersonId });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateCarPermission(id: number, formData: FormData) {
  await requireCarSettingsAccess();
  const row = await getCarModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getCarPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(carPermissions)
    .set({ userId, p1, officerPersonId })
    .where(eq(carPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteCarPermission(id: number) {
  await requireCarSettingsAccess();
  await db.delete(carPermissions).where(eq(carPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
