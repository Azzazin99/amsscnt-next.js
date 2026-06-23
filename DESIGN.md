---
name: AMSS/SMSS — สพป.ชัยนาท
description: ระบบบริหารงานภายใน สพป.ชัยนาท — UI ราชการ อ่านง่าย รองรับ 2 ธีม
colors:
  primary-light: "#1e3a8a"
  primary-dark: "#60a5fa"
  background-light: "#ffffff"
  background-dark: "#0f172a"
  foreground-light: "#1e293b"
  muted-light: "#64748b"
  destructive: "#dc2626"
  accent-gold-light: "#996515"
typography:
  body:
    fontFamily: "Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  md: "0.625rem"
  lg: "0.625rem"
spacing:
  control-height: "2.5rem"
  table-cell-x: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 0.625rem"
  input-default:
    backgroundColor: "{colors.background-light}"
    textColor: "{colors.foreground-light}"
    rounded: "{rounded.md}"
    height: "{spacing.control-height}"
---

## Overview

UI แบบ **product / government tool**: พื้นขาวหรือโทนมืด, accent น้ำเงินราชการ, ฟอนต์ Sarabun, shadcn/base-ui components. ธีมสลับด้วย `data-theme` บน `<html>` ผ่าน next-themes (`light` = ราชการ, `dark`).

## Colors

- **ราชการ (light):** พื้น `#ffffff`, ข้อความ `#1e293b`, primary `#1e3a8a`, muted `#64748b`
- **มืด:** พื้น `#0f172a`, primary `#60a5fa` (contrast ปรับแล้ว)
- **Semantic:** `--destructive` สำหรับลบ/ข้อผิดพลาด; `--accent-gold` สำหรับจุดเน้นรอง

Tokens อยู่ใน [`src/app/globals.css`](src/app/globals.css) เป็น CSS variables; Tailwind map ผ่าน `@theme inline`.

## Typography

- ครอบครัวเดียว: **Sarabun** (next/font) ทั้ง heading และ body
- หัวข้อหน้าโมดูล: `text-xl`–`text-2xl` `font-semibold` `text-primary`
- ตาราง: `text-sm`; หัวคอลัมน์ `font-bold` + `.th-word-wrap` สำหรับภาษาไทย
- ไม่ใช้ display font หรือ fluid clamp บนหน้า app

## Elevation

- การ์ดและตาราง: `border` + `shadow-sm` เบา ๆ
- Header/nav: `sticky` + `bg-card/95` + `backdrop-blur` (ใช้เท่าที่จำเป็น)
- Dialog/sheet: `shadow-lg`, overlay `bg-black/10`

## Components

- **Button:** shadcn/base-ui — variants `default`, `outline`, `secondary`, `destructive`, `ghost`
- **Form controls:** สูง `h-10`, `rounded-lg`, focus ring `ring-ring/50`
- **Data table:** TanStack Table, resize คอลัมน์, zebra rows, คอลัมน์จัดการ touch 44px
- **AlertDialog:** ยืนยันลบรายการ
- **SchoolCombobox / ThaiDateInput:** custom สำหรับโดเมนไทย

## Do's and Don'ts

**Do**

- ใช้ semantic tokens (`bg-card`, `text-muted-foreground`, `border-input`)
- ป้ายปุ่มแบบ verb + object ("ลบรายการ", "ค้นหา")
- `aria-label` บน action ในตารางและ combobox

**Don't**

- Hard-code สีนอก tokens ยกเว้น callout ชั่วคราว
- `window.confirm` / `alert` สำหรับ flow หลัก
- Pagination ซ้ำสองชุดในหน้าเดียว
- Gradient text, hero metrics, card grid marketing บนหน้า app
