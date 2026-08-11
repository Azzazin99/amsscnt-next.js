# ADR 002: มาตรฐานชนิดไฟล์แนบ (StandardAttachment)

## Status

Accepted — ก.ค. 2569

## Context

- โมดูลที่รองรับอัปโหลดไฟล์ (`book`, `bookregister`, `mail`, `leave`, `news`, `cabinet`) กำหนด allowlist ซ้ำ ๆ ในแต่ละ `*/files.ts` และ hardcode `accept=` ใน UI
- รายการเดิมรวม legacy Office (`.doc`, `.xls`, `.ppt`), `.gif`, `.zip`, `.rar` — ไม่สอดคล้องกับนโยบายใหม่
- โมดูล `leave` แคบกว่า (pdf + รูป + gif) ทั้งที่ควรใช้มาตรฐานเดียวกัน

## Decision

1. สร้างแหล่งความจริงเดียว: [`src/lib/form/attachment-allowed-types.ts`](../src/lib/form/attachment-allowed-types.ts) (client-safe)
2. **อนุญาตอัปโหลดใหม่เท่านั้น:** `docx`, `xlsx`, `pptx`, `pdf`, `jpg`, `jpeg`, `png`
3. **Grandfather:** ไฟล์ที่อัปโหลดไว้แล้วด้วยนามสกุลเก่า (เช่น `.gif`, `.zip`, `.doc`) ยังดาวน์โหลด/เปิดดูได้ — MIME maps ใน `*/files.ts` คง legacy entries ไว้
4. บังคับทั้ง client (`accept` + validation) และ server (`isAllowed*FileName` ใน API/actions)

## Glossary

| คำ | ความหมาย |
|----|----------|
| **StandardAttachment** | ชุดนามสกุลที่อนุญาตอัปโหลดใหม่ทุกโมดูล — 7 ชนิดตาม Decision |
| **Grandfather download** | ไฟล์เก่านอก StandardAttachment ยังเสิร์ฟได้ แต่อัปโหลดใหม่ถูกปฏิเสธ |

## Consequences

### ได้

- นโยบายไฟล์แนบสม่ำเสมอทุกโมดูล
- ลดความเสี่ยงจาก archive/executable ที่แนบผ่าน `.zip`/`.rar`

### ผู้ใช้ต้องปรับ

- แปลง `.doc`/`.xls`/`.ppt` เป็น Open XML ก่อนอัปโหลดใหม่
- ไม่แนบ `.gif`/`.zip`/`.rar` อีกต่อไป

### งานต่อ

- อัปเดต checklist ใน [`docs/TESTING-MODULES.md`](../TESTING-MODULES.md) (book, bookregister, mail, leave ฯลฯ) ให้ตรงรายการใหม่

## โมดูลที่ใช้

| โมดูล | Server | UI |
|-------|--------|-----|
| `book` | `src/lib/book/files.ts` | `book-attachments.tsx` |
| `bookregister` (รับ/ส่ง/คำสั่ง/เกียรติบัตร) | `src/lib/bookregister/*/files.ts` | components ที่เกี่ยวข้อง |
| `mail` | `attachment-constants.ts` | `mail-compose-attachments.tsx`, `mail-attachments.tsx` |
| `leave` | `src/lib/leave/files.ts` | `leave-request-form-shared.ts` |
| `news` | `src/lib/news/files.ts` | `news-article-form.tsx` |
| `cabinet` | `src/lib/cabinet/files.ts` | `cabinet-upload-form.tsx` |
| `permission` | `src/lib/permission/files.ts` | `permission-request-form.tsx` |
