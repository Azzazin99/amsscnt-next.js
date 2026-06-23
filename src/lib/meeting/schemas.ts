import { z } from "zod";

export const meetingBookingCreateSchema = z
  .object({
    roomCode: z.coerce
      .number()
      .int()
      .positive("กรุณาเลือกห้องประชุม"),
    bookDate: z.string().trim().min(1, "กรุณาระบุวันเริ่มใช้ห้อง"),
    bookDateEnd: z.string().trim().min(1, "กรุณาระบุวันสิ้นสุดใช้ห้อง"),
    startTime: z.coerce
      .number()
      .int()
      .min(1, "กรุณาเลือกเวลาเริ่ม")
      .max(24, "เวลาไม่ถูกต้อง"),
    finishTime: z.coerce
      .number()
      .int()
      .min(1, "กรุณาเลือกเวลาสิ้นสุด")
      .max(24, "เวลาไม่ถูกต้อง"),
    objective: z.string().trim().min(1, "กรุณาระบุวัตถุประสงค์").max(200),
    personNum: z.coerce
      .number()
      .int()
      .positive("กรุณาระบุจำนวนผู้เข้าประชุม"),
    other: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (data.bookDateEnd < data.bookDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
        path: ["bookDateEnd"],
      });
    }
    if (data.finishTime < data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม",
        path: ["finishTime"],
      });
    }
  });

export const meetingApproveSchema = z.object({
  approve: z.coerce
    .number()
    .int()
    .refine((v) => v === 1 || v === 2, "กรุณาเลือกผลการพิจารณา"),
  reason: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const meetingRoomFormSchema = z.object({
  roomName: z.string().trim().min(1, "กรุณาระบุชื่อห้อง").max(100),
  active: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export const meetingPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
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
