import { z } from "zod";

export const carRequestCreateSchema = z
  .object({
    carCode: z.coerce.number().int().positive("กรุณาเลือกยานพาหนะ"),
    place: z.string().trim().min(1, "กรุณาระบุสถานที่").max(200),
    because: z.string().trim().min(1, "กรุณาระบุวัตถุประสงค์").max(200),
    carStart: z.string().trim().min(1, "กรุณาระบุวันเริ่ม"),
    carFinish: z.string().trim().min(1, "กรุณาระบุวันสิ้นสุด"),
    timeStart: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    timeFinish: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    personNum: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    controlPerson: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    fuel: z.coerce
      .number()
      .int()
      .refine((v) => v >= 0 && v <= 2, "กรุณาเลือกเชื้อเพลิง"),
    project: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    activity: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    money: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    driverPersonId: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (data.carStart && data.carFinish && data.carFinish < data.carStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
        path: ["carFinish"],
      });
    }
  });

export const carApproveSchema = z.object({
  commanderGrant: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "กรุณาเลือกผลการพิจารณา"),
  grantComment: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const carVehicleFormSchema = z.object({
  carCode: z.coerce.number().int().positive("กรุณาระบุรหัสยานพาหนะ"),
  carTypeCode: z.coerce.number().int().positive("กรุณาเลือกประเภท"),
  carNumber: z.string().trim().min(1, "กรุณาระบุทะเบียน").max(100),
  name: z.string().trim().min(1, "กรุณาระบุชื่อยานพาหนะ").max(150),
  status: z.coerce
    .number()
    .int()
    .refine((v) => v >= 1 && v <= 3, "กรุณาเลือกสถานะ"),
  pic: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const carTypeFormSchema = z.object({
  code: z.coerce.number().int().positive("กรุณาระบุรหัสประเภท"),
  name: z.string().trim().min(1, "กรุณาระบุชื่อประเภท").max(250),
});

export const carDriverFormSchema = z.object({
  personId: z
    .string()
    .trim()
    .length(13, "เลขบัตรต้อง 13 หลัก"),
  status: z.coerce
    .number()
    .int()
    .refine((v) => v === 0 || v === 1, "กรุณาเลือกสถานะปฏิบัติหน้าที่"),
});

export const carPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.coerce
    .number()
    .int()
    .refine((v) => v >= 1 && v <= 3, "กรุณาเลือกบทบาท"),
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
