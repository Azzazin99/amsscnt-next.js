# ADR 004: เมนูตั้งค่าระบบในโมดูล — สองระดับ admin

## Status

Accepted — ก.ค. 2569

## Context

- ทุกโมดูลที่มี layout ควรมี L3 **ตั้งค่าระบบ** ใน `ModuleNav`
- เดิม lock ให้เฉพาะ `users.is_admin` เห็น section นี้
- ผู้ใช้ต้องการให้ `module_admin` เห็น section แต่เข้าได้เฉพาะหน้าสิทธิ์ (`…/permissions`)
- `p1` / เจ้าหน้าที่ทั่วไปยังไม่เห็น section

## Decision

ใช้ `getModuleSettingsNavMode(user, slug)` คืน `"none" | "permissions" | "full"`:

| Mode | ใครเห็น | ลิงก์ใน section |
|------|---------|-----------------|
| `full` | `users.is_admin` | ทุกลิงก์ config |
| `permissions` | `module_admins` (slug นั้น) | เฉพาะ href ลงท้าย `/permissions` |
| `none` | อื่น ๆ | ซ่อน section |

- Helper: [`buildModuleSettingsNavSection`](../../src/components/app-shell/module-settings-nav-section.ts)
- Page guard: `canManage*Settings` = config · `canManage*StaffPermissions` = `…/permissions`
- โมดูลที่ยังไม่มีหน้า permissions แสดงลิงก์ `planned` ใน nav (module admin เห็นแต่ยังกดไม่ได้)

### book — กลุ่มหนังสือ / อายุเก็บ

ย้าย `groups` และ `retention` เข้า section ตั้งค่าระบบ · guard ด้วย `canManageBookSettings` (`is_admin` เท่านั้น) — ไม่ให้ `p1` / `module_admin` เข้าผ่าน nav หรือ URL ตรง

## Glossary

| คำ | ความหมาย |
|----|----------|
| **module_settings_nav_mode** | `none` / `permissions` / `full` — กำหนดรายการลิงก์ใน section ตั้งค่าระบบ |
| **canManageModuleStaffPermissions** | หน้า `…/permissions` — system admin หรือ module admin ของ slug |

## Consequences

### ได้

- ครบทุกโมดูลที่มี layout · pattern เดียวกัน
- module admin จัดการสิทธิ์โมดูลตัวเองได้โดยไม่เห็น config ระดับเขต

### แลก

- แต่ละโมดูลมี `canManage*StaffPermissions` thin wrapper
- โมดูลที่ยังไม่มีหน้า permissions (book, idocument, alert, questionnaire) — module admin เห็นเมนูแต่สถานะ planned

## References

- [`CONTEXT.md`](../../CONTEXT.md) — `module_settings_menu`
- [`src/lib/core/permissions.ts`](../../src/lib/core/permissions.ts)
