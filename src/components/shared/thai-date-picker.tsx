"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatThaiDate,
  isoFromLocalDate,
  parseIsoToLocalDate,
} from "@/lib/format/thai-date";
import { FieldError } from "@/components/shared/field-error";
import { cn } from "@/lib/utils";

export type ThaiDatePickerProps = {
  /** ชื่อ field — ส่งค่า ISO "YYYY-MM-DD" ผ่าน hidden input */
  name: string;
  id?: string;
  /** ค่าเริ่มต้น ISO "YYYY-MM-DD" */
  defaultValue?: string;
  /** วันที่ต่ำสุด ISO "YYYY-MM-DD" */
  minIso?: string;
  placeholder?: string;
  required?: boolean;
  /** ข้อความ validation จากฟอร์ม (เช่น ยังไม่เลือกวัน) */
  error?: string;
  onChange?: (iso: string) => void;
  className?: string;
};

export function ThaiDatePicker({
  name,
  id,
  defaultValue,
  minIso,
  placeholder = "เลือกวันที่",
  required,
  error,
  onChange,
  className,
}: ThaiDatePickerProps) {
  const initialDate = useMemo(
    () => (defaultValue ? parseIsoToLocalDate(defaultValue) : null),
    [defaultValue],
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(
    initialDate ?? undefined,
  );
  const [touched, setTouched] = useState(false);

  const iso = selected ? isoFromLocalDate(selected) : "";
  const minDate = minIso ? parseIsoToLocalDate(minIso) ?? undefined : undefined;
  const isBeforeMin = Boolean(iso && minIso && iso < minIso);
  const minDateError =
    touched && isBeforeMin && minIso
      ? `วันที่ต้องไม่ก่อน ${formatThaiDate(minIso)}`
      : null;
  const displayError = error ?? minDateError;
  const isInvalid = Boolean(displayError);

  function handleSelect(date: Date | undefined) {
    setTouched(true);
    if (!date) return;
    const nextIso = isoFromLocalDate(date);
    if (minIso && nextIso < minIso) return;
    setSelected(date);
    onChange?.(nextIso);
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1", className)}>
      <input type="hidden" name={name} value={iso} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          render={
            <Button
              type="button"
              variant="outline"
              aria-invalid={isInvalid || undefined}
              className={cn(
                "h-10 w-full justify-start px-3 font-normal",
                !iso && "text-muted-foreground",
                isInvalid && "border-destructive",
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-60" />
          {iso ? formatThaiDate(iso) : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={th}
            selected={selected}
            onSelect={handleSelect}
            disabled={minDate ? { before: minDate } : undefined}
            defaultMonth={selected ?? minDate}
            formatters={{
              formatCaption: (date) => {
                const month = format(date, "LLLL", { locale: th });
                return `${month} ${date.getFullYear() + 543}`;
              },
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldError message={displayError} />
    </div>
  );
}
