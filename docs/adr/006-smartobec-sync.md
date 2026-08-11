# ADR 006: bookobec — เชื่อม SmartObec (สพฐ.)

## Status

Accepted — ก.ค. 2569

## Context

- โมดูล legacy `bookobec` รับส่งหนังสือราชการ สพฐ. ผ่าน **web service** ที่ `https://smart.obec.go.th/` ไม่ใช่ direct DB ของ สพฐ.
- Auth: `office_code` + `sync_code2 = md5(sync_code)` จากตาราง `system_sync_code`
- หลังรับ (พร้อมลงทะเบียน) เขียนลง local DB: `register_receives`, `book_documents`, `book_recipients`
- Next.js port มี permissions แล้ว แต่ inbox/sent ยังเป็น placeholder

## Decision

### แหล่งข้อมูล

| ชั้น | แหล่ง | หมายเหตุ |
|------|-------|----------|
| ต้นทาง | `smart.obec.go.th/modules/book/xml/*` | XML + iframe UI |
| credentials | `system_sync_code` (local) | import จาก legacy หรือตั้งที่ `/modules/bookobec/settings` |
| ชื่อหน่วยงานส่ง | legacy `system_khet` (ถ้ามีใน DB) | fallback `สพฐ./อื่นๆ` |

### Hybrid UI (ตรง legacy)

| เมนู legacy | Next.js | วิธี |
|-------------|---------|------|
| รับหนังสือพร้อมลงทะเบียน | inbox (ส่วนบน) | native: fetch `bookobec.php` XML → server action ลงทะเบียน |
| รับหนังสือ | inbox (iframe) | embed `receive_bookobec.php` |
| รายการหนังสือรับ สพฐ. | inbox (iframe, ผู้ไม่มี p1) | embed `receive_bookobec_other.php` |
| ส่งหนังสือ สพฐ. | sent (iframe, p2) | embed `send_bookobec.php` |
| รายการหนังสือส่ง สพฐ. | sent (iframe) | embed `send_report_bookobec.php` |
| เชื่อมกับ SMART OBEC | settings | CRUD `system_sync_code` (smss admin) |

### Magic numbers (parity legacy)

- `book_type = 5`, `book_link = 5`, `book_regis_link = 5`
- `send_level = 2`, `send_to = 'saraban'`, `answered = true`
- กัน duplicate ด้วย `ref_id` จาก สพฐ.

### ความเสี่ยงที่ยอมรับ

- WAF/X-Frame อาจบล็อก iframe → มีปุ่ม «เปิดในแท็บใหม่»
- `person` param = `personId` (เลขบัตร 13 หลัก) ของผู้ login

## Glossary

| คำ | ความหมาย |
|----|----------|
| **SmartObec** | ระบบรับส่งหนังสือราชการส่วนกลาง สพฐ. ที่ `smart.obec.go.th` |
| **sync_code** | รหัสลับของเขต สำหรับ auth กับ SmartObec — เก็บ local ใน `system_sync_code` |
| **bookobec** | โมดูล AMSS สำหรับรับส่งหนังสือกับ สพฐ. (แยกจาก `book` ภายในเขต) |

## Consequences

### ได้

- inbox/sent เชื่อม SmartObec ได้จริง (hybrid)
- ลงทะเบียนรับ + ส่งเข้าระบบ `book` อัตโนมัติเมื่อรับจาก สพฐ.

### แลก

- ส่วน รับ/ส่ง/รายงาน ยังพึ่ง UI ของ สพฐ. ใน iframe
- ต้องมี `sync_code` จริงจาก production/legacy ถึงจะดึงรายการได้

## References

- [`src/lib/bookobec/obec-url.ts`](../../src/lib/bookobec/obec-url.ts)
- [`src/lib/bookobec/receive-register.ts`](../../src/lib/bookobec/receive-register.ts)
- [`docs/TESTING-MODULES.md`](../TESTING-MODULES.md#bookobec)
- Legacy: `smart_kpp2/modules/bookobec/main/receive_register.php`
