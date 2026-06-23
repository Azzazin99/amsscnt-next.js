"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SchoolOption = { code: string; name: string };

type SchoolComboboxProps = {
  name: string;
  schools: SchoolOption[];
  value: string;
  onChange: (code: string) => void;
  id?: string;
  labelId?: string;
};

const OTHER_VALUE = "other";
/** จำกัด DOM เมื่อยังไม่พิมพ์ค้นหา — ลดภาระเมื่อมีโรงเรียนหลายร้อยแห่ง */
const MAX_SCHOOLS_WITHOUT_QUERY = 50;

const triggerClass =
  "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SchoolCombobox({
  name,
  schools,
  value,
  onChange,
  id,
  labelId,
}: SchoolComboboxProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedLabel = useMemo(() => {
    if (value === OTHER_VALUE) return "หน่วยงานอื่น ๆ";
    if (!value) return "";
    const found = schools.find((s) => s.code === value);
    return found ? `${found.code} ${found.name}` : value;
  }, [value, schools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [query, schools]);

  const hasQuery = query.trim().length > 0;
  const listSchools = useMemo(() => {
    if (hasQuery) return filtered;
    return filtered.slice(0, MAX_SCHOOLS_WITHOUT_QUERY);
  }, [filtered, hasQuery]);

  const truncatedWithoutQuery =
    !hasQuery && filtered.length > MAX_SCHOOLS_WITHOUT_QUERY;

  /** รายการที่เลือกได้: other + โรงเรียนที่กรองแล้ว */
  const optionCodes = useMemo(
    () => [OTHER_VALUE, ...listSchools.map((s) => s.code)],
    [listSchools],
  );

  useEffect(() => {
    if (open) {
      const selectedIdx = optionCodes.indexOf(value);
      setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery("");
    setActiveIndex(0);
  }, [open, optionCodes, value]);

  useEffect(() => {
    if (!open) return;
    const el = optionRefs.current[activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function select(code: string) {
    onChange(code);
    setOpen(false);
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          optionCodes.length === 0 ? 0 : Math.min(i + 1, optionCodes.length - 1),
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(Math.max(optionCodes.length - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (optionCodes[activeIndex]) select(optionCodes[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  }

  function renderOption(code: string, index: number) {
    const isOther = code === OTHER_VALUE;
    const school = schools.find((s) => s.code === code);
    const selected = value === code;
    const active = activeIndex === index;

    return (
      <li key={code} role="none">
        <button
          ref={(el) => {
            optionRefs.current[index] = el;
          }}
          type="button"
          role="option"
          id={`${listboxId}-option-${index}`}
          aria-selected={selected}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => select(code)}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted",
            active && "bg-muted",
          )}
        >
          <Check
            className={cn(
              "size-4 shrink-0",
              selected ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
          {isOther ? (
            <span className="font-medium">หน่วยงานอื่น ๆ</span>
          ) : school ? (
            <span className="truncate">
              <span className="text-muted-foreground">{school.code}</span>{" "}
              {school.name}
            </span>
          ) : null}
        </button>
      </li>
    );
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleListKeyDown}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={labelId}
        className={triggerClass}
      >
        <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || "เลือกโรงเรียน / หน่วยงาน"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          id={listboxId}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg"
          role="listbox"
          aria-labelledby={labelId}
        >
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              aria-label="ค้นหาโรงเรียนหรือรหัส"
              placeholder="พิมพ์ชื่อหรือรหัสโรงเรียน..."
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            {truncatedWithoutQuery ? (
              <li
                className="border-b px-3 py-2 text-xs text-muted-foreground"
                role="none"
              >
                แสดง {MAX_SCHOOLS_WITHOUT_QUERY} รายการแรก — พิมพ์ค้นหาเพื่อหาโรงเรียนอื่น
              </li>
            ) : null}
            {filtered.length === 0 && hasQuery ? (
              <li className="px-3 py-3 text-center text-muted-foreground" role="none">
                ไม่พบโรงเรียนที่ค้นหา
              </li>
            ) : (
              optionCodes.map((code, index) => renderOption(code, index))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
