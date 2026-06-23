"use client";

import { useMemo, useState } from "react";
import type { PersonOption } from "@/lib/mail/queries";

type Props = {
  people: PersonOption[];
  name?: string;
  defaultSelected?: string[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function matchesSearch(person: PersonOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    person.label.toLowerCase().includes(q) ||
    person.personId.toLowerCase().includes(q)
  );
}

export function PersonCheckboxPicker({
  people,
  name = "personIds",
  defaultSelected = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected),
  );

  const filtered = useMemo(
    () => people.filter((p) => matchesSearch(p, search)),
    [people, search],
  );

  const displayList = useMemo(() => {
    const selectedPeople = people.filter((p) => selected.has(p.personId));
    const filteredIds = new Set(filtered.map((p) => p.personId));
    const selectedNotInFilter = selectedPeople.filter(
      (p) => !filteredIds.has(p.personId),
    );
    return [...selectedNotInFilter, ...filtered];
  }, [people, selected, filtered]);

  function toggle(personId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(personId);
      else next.delete(personId);
      return next;
    });
  }

  return (
    <div className="space-y-2 pt-2">
      <label htmlFor="person-search" className="text-sm font-medium">
        ค้นหารายชื่อ
      </label>
      <input
        id="person-search"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="พิมพ์ชื่อ นามสกุล หรือรหัสบุคลากร"
        className={inputClass}
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground">
        เลือกแล้ว {selected.size} คน
        {search.trim() ? ` · แสดง ${displayList.length} รายการ` : null}
      </p>

      {[...selected].map((personId) => (
        <input key={personId} type="hidden" name={name} value={personId} />
      ))}

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
        {displayList.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            ไม่พบรายชื่อที่ตรงกับคำค้นหา
          </p>
        ) : (
          displayList.map((p) => {
            const isSelected = selected.has(p.personId);
            return (
              <label
                key={p.personId}
                className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggle(p.personId, e.target.checked)}
                />
                <span className={isSelected ? "font-medium" : undefined}>
                  {p.label}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
