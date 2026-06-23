import { z } from "zod";

export const yearFormSchema = z.object({
  year: z.coerce
    .number()
    .int("ปีต้องเป็นจำนวนเต็ม")
    .min(2500, "ปีต้องเป็น พ.ศ.")
    .max(2700, "ปีไม่ถูกต้อง"),
  yearActive: z.enum(["true", "false"]).transform((v) => v === "true"),
  startReceiveNum: z.coerce.number().int().min(0).max(99999),
  startSendNum: z.coerce.number().int().min(0).max(99999),
  startCommandNum: z.coerce.number().int().min(0).max(99999),
  startCertificateNum: z.coerce.number().int().min(0).max(99999),
});

export type YearFormInput = z.infer<typeof yearFormSchema>;
