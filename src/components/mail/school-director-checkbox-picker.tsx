"use client";

import {
  GroupedPersonCheckboxPicker,
  type PersonGroupOption,
} from "@/components/mail/grouped-person-checkbox-picker";
import type { SchoolDirectorGroupOption } from "@/lib/mail/queries";

type Props = {
  groups: SchoolDirectorGroupOption[];
  name?: string;
};

function toPersonGroups(
  groups: SchoolDirectorGroupOption[],
): PersonGroupOption[] {
  return groups.map((group) => ({
    groupKey: String(group.schoolId ?? "unassigned"),
    groupName: group.schoolName,
    people: group.directors,
  }));
}

export function SchoolDirectorCheckboxPicker({ groups, name }: Props) {
  return (
    <GroupedPersonCheckboxPicker
      groups={toPersonGroups(groups)}
      name={name}
      label="เลือกผู้อำนวยการโรงเรียน"
      searchId="school-director-search"
      searchPlaceholder="ค้นหาชื่อหรือชื่อโรงเรียน"
      emptyMessage="ไม่พบผู้อำนวยการที่ตรงกับคำค้นหา"
    />
  );
}
