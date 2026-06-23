"use client";

import {
  GroupedPersonCheckboxPicker,
  type PersonGroupOption,
} from "@/components/mail/grouped-person-checkbox-picker";
import type { SchoolStaffGroupOption } from "@/lib/mail/queries";

type Props = {
  groups: SchoolStaffGroupOption[];
  name?: string;
};

function toPersonGroups(groups: SchoolStaffGroupOption[]): PersonGroupOption[] {
  return groups.map((group) => ({
    groupKey: String(group.schoolId ?? "unassigned"),
    groupName: group.schoolName,
    people: group.staff,
  }));
}

export function SchoolStaffCheckboxPicker({ groups, name }: Props) {
  return (
    <GroupedPersonCheckboxPicker
      groups={toPersonGroups(groups)}
      name={name}
      label="เลือกครูและบุคลากรในสถานศึกษา"
      searchId="school-staff-search"
      searchPlaceholder="ค้นหาชื่อหรือชื่อโรงเรียน"
      emptyMessage="ไม่พบบุคลากรที่ตรงกับคำค้นหา"
    />
  );
}
