# ADR 007: plan — เมนูครบ Amssplus + surplus unified schema

## Status

Accepted (ก.ค. 2569)

## Context

โมดูล `plan` v1 มีแค่ปีงบประมาณ + โครงการ + กิจกรรม (flat nav) · legacy Amssplus มี 7 กลุ่มเมนู รวมยุทธศาสตร์ เงินเหลือจ่าย SMSS ตรวจสอบ และรายงาน · `docs/modules.md` § plan บันทึกไม่ครบ (3 รายการ)

## Decision

1. **In-module flyout** ตรง Amssplus 7 กลุ่ม — config ใน `src/lib/plan/nav-config.ts` · L1 ยังเป็นรายการเดียว «การวางแผน»
2. **Surplus unified** — `plan_projects.project_kind` (`annual` | `surplus`) แทน duplicate `plan_proj_2` · funding หลายแหล่งใน `plan_activity_funding` (legacy `plan_acti_3`)
3. **สิทธิ์** — `plan_permissions` (add/edit/delete) แทน session `mpms_*` · module admin bypass
4. **Budget-linked pages** — อ่าน `budget_receive` + `budget_pay_types` · empty-state เมื่อไม่มีข้อมูล (budget MVP ยังไม่รับ allocation ผ่าน UI)
5. **SMSS** — preview XML จาก `system_sync_smss_2` แล้ว confirm import (ไม่เขียน DB จนกดยืนยัน)
6. **Self-check** — `src/lib/plan/nav-self-check.ts` assert flyout + href ครบ

## Consequences

- Import legacy ต้อง map `plan_proj_2` → `project_kind=surplus`
- หน้าตรวจสอบ/รายงานจัดสรรจะว่างจนกว่ามี `budget_receive` ใน DB
- Route `/modules/plan/activities/*` คงไว้เป็น deep link ไม่อยู่ใน flyout (ตรง Amssplus)
- คู่มือ PDF ยังเป็น placeholder (`/modules/plan/manual`)
