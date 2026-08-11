import { z } from "zod";

export const permissionRequestCreateSchema = z
  .object({
    subject: z.string().trim().min(1, "กรุณาระบุเรื่อง/วัตถุประสงค์").max(150),
    place: z.string().trim().min(1, "กรุณาระบุสถานที่").max(150),
    travelStart: z.string().trim().min(1, "กรุณาระบุวันเริ่มไปราชการ"),
    travelFinish: z.string().trim().min(1, "กรุณาระบุวันสิ้นสุด"),
    vehicle: z
      .string()
      .trim()
      .max(150)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    document: z
      .string()
      .trim()
      .max(150)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (
      data.travelStart &&
      data.travelFinish &&
      data.travelFinish < data.travelStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
        path: ["travelFinish"],
      });
    }
  });

export const permissionApproveSchema = z.object({
  grantStatus: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "กรุณาเลือกผลการพิจารณา"),
  grantComment: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const permissionYearFormSchema = z.object({
  budgetYear: z.coerce
    .number()
    .int()
    .min(2500, "ปีงบประมาณไม่ถูกต้อง")
    .max(2700, "ปีงบประมาณไม่ถูกต้อง"),
  yearActive: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export const permissionModulePermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v || v.length === 0) return null;
      return v;
    })
    .refine((v) => v === null || /^\d{13}$/.test(v), {
      message: "เลขบัตรเจ้าหน้าที่ต้อง 13 หลัก",
    }),
});

export const permissionGrantPersonFormSchema = z.object({
  groupPersonId: z.string().nullable().optional(),
  personId: z.string().trim().min(1, "กรุณาเลือกบุคลากร"),
});
