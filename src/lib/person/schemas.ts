import { z } from "zod";
import { isValidPositionCode } from "@/lib/person/position-labels";

const orgType = z.enum(["district", "school"]);

const personBaseFields = {
  personId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "เลขบัตรประชาชนต้อง 13 หลัก"),
  prefix: z.enum(["นาย", "นาง", "นางสาว"], {
    message: "กรุณาเลือกคำนำหน้า",
  }),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  organizationType: orgType,
  schoolId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable(),
  ),
  workgroupId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable(),
  ),
  positionCode: z.coerce
    .number()
    .int()
    .refine(isValidPositionCode, "ตำแหน่งไม่ถูกต้อง"),
  status: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "สถานะไม่ถูกต้อง"),
  multiSchool: z.preprocess(
    (val) => val === "on" || val === "true" || val === true || val === "1",
    z.boolean(),
  ),
  serviceStartDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 && v !== "0000-00-00" ? v : null)),
  personOrder: z.coerce.number().int().optional().default(0),
};

function orgRefine(data: {
  organizationType: "district" | "school";
  schoolId: number | null;
  workgroupId: number | null;
}) {
  if (data.organizationType === "school" && !data.schoolId) {
    return "กรุณาเลือกสถานศึกษา";
  }
  return null;
}

export const personCreateSchema = z
  .object(personBaseFields)
  .superRefine((data, ctx) => {
    const msg = orgRefine(data);
    if (msg) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["schoolId"] });
    }
  });

export const personUpdateSchema = personCreateSchema;

export const personPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p3: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export function parseExtraSchoolIds(formData: FormData): number[] {
  const raw = formData.getAll("extraSchoolIds");
  const ids = raw
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(ids)];
}
