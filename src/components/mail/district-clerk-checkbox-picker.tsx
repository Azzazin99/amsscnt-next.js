"use client";

import {
  GroupedPersonCheckboxPicker,
  type PersonGroupOption,
} from "@/components/mail/grouped-person-checkbox-picker";
import type { DistrictClerkGroupOption } from "@/lib/mail/queries";

type Props = {
  groups: DistrictClerkGroupOption[];
  name?: string;
};

function toPersonGroups(groups: DistrictClerkGroupOption[]): PersonGroupOption[] {
  return groups.map((group) => ({
    groupKey: String(group.workgroupId ?? "unassigned"),
    groupName: group.workgroupName,
    people: group.clerks,
  }));
}

export function DistrictClerkCheckboxPicker({ groups, name }: Props) {
  return (
    <GroupedPersonCheckboxPicker
      groups={toPersonGroups(groups)}
      name={name}
      label="เลือกธุรการกลุ่ม/หน่วย"
      searchId="district-clerk-search"
      searchPlaceholder="ค้นหาชื่อหรือชื่อกลุ่ม"
      emptyMessage="ไม่พบธุรการที่ตรงกับคำค้นหา"
    />
  );
}
