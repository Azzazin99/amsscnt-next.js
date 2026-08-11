# ADR 003: การมองเห็นหน้าอนุมัติตามสิทธิ์ (module approval visibility)

## Status

Accepted — ก.ค. 2569

## Context

- โมดูลที่มี workflow อนุมัติ (leave, permission) มี inbox แยกตามบทบาท
- บุคลากรทั่วไปไม่ควรเห็นเมนูหรือเข้า URL คิวอนุมัติที่ไม่ได้รับมอบหมาย
- โมดูล leave เคย hardcode คิวยกเลิกวันลาใน nav ให้ทุกคนเห็น และบางหน้า inbox ไม่มี page guard
- โมดูล permission ทำครบแล้ว — ใช้เป็น template

## Decision

ทุกโมดูลที่มี inbox/route อนุมัติ ต้องใช้ **defense in depth** สามชั้น จากแหล่งสิทธิ์เดียวกัน:

1. **Resolver (server-only)** — `resolve*ApprovalNav*` ใน `src/lib/{module}/approval-nav.ts` คืนรายการเมนูที่ viewer มีสิทธิ์
2. **Nav** — layout ส่งผล resolver ไป client nav; ซ่อนรายการหรือซ่อนทั้ง flyout ถ้าไม่มีรายการ (`visible: length > 0` หรือ `visible: showX`)
3. **Page guard** — หน้า inbox `redirect` ถ้าเข้า URL ตรงโดยไม่มีสิทธิ์ (`canAccess*Inbox`)
4. **Detail (ถ้ามี)** — ซ่อนฟอร์มอนุมัติด้วย check เดียวกับ inbox

### แหล่งสิทธิ์ต่อโมดูล

| โมดูล | แหล่งสิทธิ์ | ไฟล์ |
|-------|------------|------|
| leave | `leave_person_settings` (`comment_person` / `comment_person2` / `grant_person`) | [`src/lib/leave/approval-nav.ts`](../src/lib/leave/approval-nav.ts) |
| permission | `permission_person_settings` (`group_person` / `grant_person`) | [`src/lib/permission/approval-nav.ts`](../src/lib/permission/approval-nav.ts) |
| car, meeting | module `p1` flags (อนุมัติบนหน้ารายละเอียดเท่านั้น — ยังไม่มี inbox nav) | `*/permissions.ts` |

### leave — การจัดเมนู

- Flyout **พิจารณาอนุมัติ** = คิวคำขอลา (`resolveLeaveApprovalNavItems`)
- Flyout **ขอยกเลิกวันลา** = รายการยื่นยกเลิก (ทุกคน) + คิวอนุมัติยกเลิก (`resolveLeaveCancellationApprovalNavItems`) เฉพาะผู้อนุมัติ

## Glossary

| คำ | ความหมาย |
|----|----------|
| **module_approval_nav** | pattern resolver + nav filter + page guard สำหรับ inbox อนุมัติ |
| **canAccess*Inbox** | ฟังก์ชันตรวจสิทธิ์ inbox หนึ่งขั้น — ใช้ทั้ง nav resolver และ page |

## Consequences

### ได้

- บุคลากรทั่วไปไม่เห็นเมนูอนุมัติที่ไม่เกี่ยว
- URL ตรงถูก redirect — ไม่พึ่งซ่อนเมนูอย่างเดียว
- โมดูลใหม่มี template ชัด (permission / leave)

### แลก

- แต่ละโมดูลมี `approval-nav.ts` แยก — ยังไม่ abstract ร่วม (YAGNI จนกว่าจะมีโมดูลที่ 4+)

## References

- [`CONTEXT.md`](../../CONTEXT.md) — `module_approval_nav`, `leave_approval_nav`
- [`docs/TESTING-MODULES.md#leave`](../TESTING-MODULES.md#leave) — UAT inbox ตามบทบาท
