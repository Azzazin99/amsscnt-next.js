import { z } from "zod";
import { parseMailRecipientCategory } from "@/lib/mail/recipient-options";

const PERSON_REQUIRED_MESSAGES = {
  selected: "กรุณาเลือกผู้รับ",
  district_clerks: "กรุณาเลือกธุรการกลุ่ม/หน่วย",
  school_directors: "กรุณาเลือกผู้อำนวยการสถานศึกษา",
  school_staff: "กรุณาเลือกครูและบุคลากรในสถานศึกษา",
} as const;

export const mailCreateSchema = z
  .object({
    subject: z.string().trim().min(1, "กรุณาระบุเรื่อง").max(150),
    detail: z.string().trim().max(5000).optional(),
    recipientCategory: z.string().trim().min(1, "กรุณาเลือกผู้รับ"),
    personIds: z.array(z.string().trim().min(1).max(13)).optional(),
    workgroupIds: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    const category = parseMailRecipientCategory(data.recipientCategory);
    if (!category) {
      ctx.addIssue({
        code: "custom",
        message: "รูปแบบผู้รับไม่ถูกต้อง",
        path: ["recipientCategory"],
      });
      return;
    }

    if (category === "workgroups") {
      if (!data.workgroupIds?.length) {
        ctx.addIssue({
          code: "custom",
          message: "กรุณาเลือกกลุ่ม/หน่วยอย่างน้อย 1 กลุ่ม",
          path: ["workgroupIds"],
        });
      }
      return;
    }

    if (category !== "all" && !data.personIds?.length) {
      ctx.addIssue({
        code: "custom",
        message: PERSON_REQUIRED_MESSAGES[category],
        path: ["personIds"],
      });
    }
  });

export type MailCreateInput = z.infer<typeof mailCreateSchema>;

export const mailGroupSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อกลุ่ม").max(255),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  personIds: z.array(z.string().trim().min(1).max(13)).default([]),
});

export const mailPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: z
    .string()
    .trim()
    .max(13)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});
