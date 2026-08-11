# ADR 005: bookregister — ไม่มีเมนูแบบพิมพ์/รายงาน

## Status

Accepted — ก.ค. 2569

## Context

- Legacy AMSS (`context.html` §2.2) และ [`docs/modules.md`](../modules.md) § bookregister **ไม่มี** flyout แบบพิมพ์/รายงาน
- Next.js เคยเพิ่มฟีเจอร์แยก: ศูนย์รายงาน, ทะเบียนรับ/ส่ง/คำสั่งตามปี (P1.8–P1.9), CSV export (P041), ลิงก์บนหน้ารายการทะเบียน
- ผู้ใช้ต้องการให้ nav bookregister ตรง legacy — ตัดฟีเจอร์รายงานทั้งหมดออกจาก v1

## Decision

ลบออกจากโมดูล `bookregister`:

| ส่วน | รายละเอียด |
|------|------------|
| Nav | flyout **แบบพิมพ์/รายงาน** และเมนูย่อยทั้งหมด |
| หน้า UI | `/modules/bookregister/reports/*` |
| API | `/api/bookregister/reports/*`, `/api/bookregister/export/*` |
| ลิงก์ inline | ปุ่มแบบพิมพ์ + ส่งออก CSV บนหน้ารายการรับ/ส่ง/คำสั่ง |
| lib/components | `src/lib/bookregister/reports`, `export` และคู่กันใน `components/` |

ทะเบียนรับ/ส่ง/คำสั่ง/เกียรติบัตร + ตั้งค่า + คู่มือ **คงไว้**

ถ้าต้องการแบบพิมพ์ตามระเบียบ 2546 ในอนาคต — ทำ phase ใหม่ อ้าง legacy หรือความต้องการเขต ไม่ reuse route เดิม

## Glossary

| คำ | ความหมาย |
|----|----------|
| **bookregister reports** | ฟีเจอร์รายงาน/HTML/CSV ทะเบียนที่ถูกตัดออกจาก v1 — **ไม่ใช่** `leave/reports` หรือ `permission/reports` |

## Consequences

### ได้

- เมนู bookregister สอดคล้อง legacy และ `docs/modules.md`
- ลด surface area ที่ไม่มีใน AMSS เดิม

### แลก

- ไม่มี export/พิมพ์ทะเบียนตามปีในระบบ — ผู้ใช้พิมพ์จาก browser หรือ export ภายนอก
- P1.9 / P041 ใน `context.html` ยังเป็น historical record; ADR นี้บันทึกการถอยกลับ

## References

- [`src/components/bookregister/bookregister-nav.tsx`](../../src/components/bookregister/bookregister-nav.tsx)
- [`docs/TESTING-MODULES.md`](../TESTING-MODULES.md#bookregister)
