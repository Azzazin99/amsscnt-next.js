# ADR 001: Export LegacyDump จากเว็บ (admin only)

## Status

Accepted — มิ.ย. 2569

## Context

- Dev/UAT ใช้ [`smart_area_postgres.sql`](../smart_area_postgres.sql) โหลดผ่าน `npm run db:load-legacy`
- หลัง `db:import-smart-area` ฐานข้อมูลมีทั้งตาราง **legacy** (~200) และตาราง **app** (Drizzle) ใน schema `public`
- นักวิชาการคอมเขตต้องการดาวน์โหลด dump จากแอป Next.js โดยไม่ SSH เข้าเซิร์ฟเวอร์

## Decision

1. เพิ่ม **LegacyDump export** ที่ `/admin/dev/export-legacy` + `GET /api/admin/legacy-dump`
2. สิทธิ์: **`isSuperAdmin` เท่านั้น** (ข้อมูลมี `system_user.userpass` MD5 + เลขบัตร)
3. Feature flag: `AMSS_ENABLE_LEGACY_DUMP_EXPORT=1` หรือ `NODE_ENV=development` — **on-prem เท่านั้น** ไม่พึ่ง Vercel
4. ใช้ `pg_dump --exclude-table` สำหรับทุกตาราง Drizzle app — ได้เฉพาะ legacy tables
5. Sanitize SQL ด้วยกฎเดียวกับ [`scripts/load-legacy-dump.sh`](../scripts/load-legacy-dump.sh) ผ่าน [`src/lib/dev/legacy-dump-sanitize.ts`](../src/lib/dev/legacy-dump-sanitize.ts)

## Glossary

| คำ | ความหมาย |
|----|----------|
| **LegacyDump** | SQL ตาราง legacy ใน `public` — ใช้ `db:load-legacy` / handoff ไปเครื่อง dev |
| **FullBackup** | `pg_dump -Fc` ทั้ง DB รวม app tables — cron P999 ใน DEPLOY-ONPREM |

## Consequences

### ได้

- ดาวน์โหลดไฟล์ `.sql` ที่ `psql` / `db:load-legacy` รันได้
- ไม่รวมตาราง app (`people`, `users`, `leave_requests` ฯลฯ)

### ไม่ได้ / ไม่สัญญา

- ไฟล์ **byte-identical** กับ `smart_area_postgres.sql` ใน git (format Navicat vs `pg_dump`)
- ไม่แทน **FullBackup** cron — restore ทั้งระบบยังใช้ `pg_dump -Fc`

### ความเสี่ยง

| ความเสี่ยง | การลด |
|-----------|--------|
| รหัสผ่าน + PII ในไฟล์ | super-admin only, HTTPS, audit log ใน server console |
| Timeout / OOM | on-prem PM2, stream จาก `pg_dump`, lock export พร้อมกัน 1 งาน |
| โหลดผิด DB | คำเตือน UI + ชื่อไฟล์ `legacy-YYYY-MM-DD.sql` |

## Alternatives considered

- **pg_dump ทั้ง DB** — ปฏิเสธ; รวม app schema ทำให้ re-import legacy ซ้ำซ้อน
- **Custom Navicat-style generator** — ปฏิเสธ; แพงเกินจำเป็น
- **SCP + cron เท่านั้น** — ยังใช้เป็น production path; เว็บเป็น convenience สำหรับ staging/dev handoff
