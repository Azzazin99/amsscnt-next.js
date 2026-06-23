"use client";

import { useMemo, useState } from "react";
import type { PersonOption } from "@/lib/mail/queries";

export type PersonGroupOption = {
  groupKey: string;
  groupName: string;
  people: PersonOption[];
};

type Props = {
  groups: PersonGroupOption[];
  name?: string;
  label: string;
  searchId: string;
  searchPlaceholder: string;
  emptyMessage: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GroupedPersonCheckboxPicker({
  groups,
  name = "personIds",
  label,
  searchId,
  searchPlaceholder,
  emptyMessage,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((group) => ({
        ...group,
        people: group.people.filter(
          (person) =>
            person.label.toLowerCase().includes(q) ||
            person.personId.toLowerCase().includes(q) ||
            group.groupName.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.people.length > 0);
  }, [groups, search]);

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
      <label htmlFor={searchId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={searchId}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className={inputClass}
        autoComplete="off"
      />
      <p className="text-xs text-muted-foreground">เลือกแล้ว {selected.size} คน</p>

      {[...selected].map((personId) => (
        <input key={personId} type="hidden" name={name} value={personId} />
      ))}

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-2">
        {filteredGroups.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.groupKey} className="space-y-1">
              <p className="px-1 text-xs font-semibold text-muted-foreground">
                {group.groupName}
              </p>
              {group.people.map((person) => {
                const isSelected = selected.has(person.personId);
                return (
                  <label
                    key={person.personId}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggle(person.personId, e.target.checked)}
                    />
                    <span className={isSelected ? "font-medium" : undefined}>
                      {person.label}
                    </span>
                  </label>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
