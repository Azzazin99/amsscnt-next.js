"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { WorkgroupMemberGroupOption } from "@/lib/mail/queries";

type GroupSendMode = "whole" | "members";

export type WorkgroupCheckboxPickerHandle = {
  validate: () => string | null;
};

type Props = {
  groups: WorkgroupMemberGroupOption[];
  workgroupIdsName?: string;
  personIdsName?: string;
};

function clearGroupMembers(
  memberIds: Set<string> | undefined,
  selected: Set<string>,
): Set<string> {
  if (!memberIds || memberIds.size === 0) return selected;
  const next = new Set(selected);
  for (const personId of memberIds) {
    next.delete(personId);
  }
  return next;
}

function countMembersInGroup(
  memberIds: Set<string> | undefined,
  selected: Set<string>,
): number {
  if (!memberIds) return 0;
  let count = 0;
  for (const personId of memberIds) {
    if (selected.has(personId)) count += 1;
  }
  return count;
}

export const WorkgroupCheckboxPicker = forwardRef<
  WorkgroupCheckboxPickerHandle,
  Props
>(function WorkgroupCheckboxPicker(
  {
    groups,
    workgroupIdsName = "workgroupIds",
    personIdsName = "personIds",
  },
  ref,
) {
  const [selectedWorkgroups, setSelectedWorkgroups] = useState<Set<number>>(
    () => new Set(),
  );
  const [groupModes, setGroupModes] = useState<Map<number, GroupSendMode>>(
    () => new Map(),
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    () => new Set(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const membersByWorkgroup = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const group of groups) {
      map.set(
        group.workgroupId,
        new Set(group.members.map((member) => member.personId)),
      );
    }
    return map;
  }, [groups]);

  const groupsById = useMemo(
    () => new Map(groups.map((group) => [group.workgroupId, group])),
    [groups],
  );

  const selectedGroupList = useMemo(
    () => groups.filter((group) => selectedWorkgroups.has(group.workgroupId)),
    [groups, selectedWorkgroups],
  );

  const wholeGroupCount = useMemo(
    () =>
      selectedGroupList.filter(
        (group) => (groupModes.get(group.workgroupId) ?? "whole") === "whole",
      ).length,
    [selectedGroupList, groupModes],
  );

  function validateSelection(): string | null {
    for (const group of selectedGroupList) {
      const mode = groupModes.get(group.workgroupId) ?? "whole";
      if (mode !== "members") continue;

      const memberIds = membersByWorkgroup.get(group.workgroupId);
      const picked = countMembersInGroup(memberIds, selectedMembers);
      if (picked === 0) {
        return `กรุณาเลือกสมาชิกในกลุ่ม «${group.workgroupName}» อย่างน้อย 1 คน`;
      }
    }
    return null;
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const message = validateSelection();
      setValidationError(message);
      return message;
    },
  }));

  function toggleWorkgroup(workgroupId: number, checked: boolean) {
    setValidationError(null);

    setSelectedWorkgroups((prev) => {
      const next = new Set(prev);
      if (checked) next.add(workgroupId);
      else next.delete(workgroupId);
      return next;
    });

    if (checked) {
      setGroupModes((prev) => {
        const next = new Map(prev);
        next.set(workgroupId, "whole");
        return next;
      });
      return;
    }

    setGroupModes((prev) => {
      const next = new Map(prev);
      next.delete(workgroupId);
      return next;
    });

    setSelectedMembers((prev) =>
      clearGroupMembers(membersByWorkgroup.get(workgroupId), prev),
    );
  }

  function setGroupMode(workgroupId: number, mode: GroupSendMode) {
    setValidationError(null);

    setGroupModes((prev) => {
      const next = new Map(prev);
      next.set(workgroupId, mode);
      return next;
    });

    if (mode === "whole") {
      setSelectedMembers((prev) =>
        clearGroupMembers(membersByWorkgroup.get(workgroupId), prev),
      );
    }
  }

  function toggleMember(personId: string, checked: boolean) {
    setValidationError(null);
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (checked) next.add(personId);
      else next.delete(personId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium">กลุ่ม/หน่วย</p>
        <p className="text-xs text-muted-foreground">
          เลือกแล้ว {selectedWorkgroups.size} กลุ่ม
          {wholeGroupCount > 0 ? ` · ส่งทั้งกลุ่ม ${wholeGroupCount}` : ""}
          {selectedMembers.size > 0
            ? ` · เลือกรายคน ${selectedMembers.size} คน`
            : ""}
        </p>

        {[...selectedWorkgroups].map((workgroupId) => (
          <input
            key={workgroupId}
            type="hidden"
            name={workgroupIdsName}
            value={String(workgroupId)}
          />
        ))}

        {[...selectedMembers].map((personId) => (
          <input
            key={personId}
            type="hidden"
            name={personIdsName}
            value={personId}
          />
        ))}

        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-2">
          {groups.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              ไม่พบกลุ่ม/หน่วย
            </p>
          ) : (
            groups.map((group) => {
              const isSelected = selectedWorkgroups.has(group.workgroupId);
              return (
                <label
                  key={group.workgroupId}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      toggleWorkgroup(group.workgroupId, e.target.checked)
                    }
                  />
                  <span className={isSelected ? "font-medium" : undefined}>
                    {group.workgroupName}
                    {group.members.length > 0 ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({group.members.length} คน)
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {selectedGroupList.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm font-medium">วิธีส่งต่อกลุ่ม</p>

          <div className="max-h-96 space-y-4 overflow-y-auto rounded-md border bg-background p-2">
            {selectedGroupList.map((group) => {
              const mode = groupModes.get(group.workgroupId) ?? "whole";
              const groupMeta = groupsById.get(group.workgroupId);

              return (
                <div
                  key={group.workgroupId}
                  className="space-y-2 rounded-md border border-border/60 p-2"
                >
                  <p className="text-sm font-medium">{group.workgroupName}</p>

                  <div className="flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`workgroup-mode-${group.workgroupId}`}
                        checked={mode === "whole"}
                        onChange={() =>
                          setGroupMode(group.workgroupId, "whole")
                        }
                      />
                      ส่งทั้งกลุ่ม
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`workgroup-mode-${group.workgroupId}`}
                        checked={mode === "members"}
                        onChange={() =>
                          setGroupMode(group.workgroupId, "members")
                        }
                      />
                      เลือกรายคน
                    </label>
                  </div>

                  {mode === "members" ? (
                    <div className="space-y-1 border-t border-border/60 pt-2">
                      {groupMeta && groupMeta.members.length === 0 ? (
                        <p className="px-1 py-1 text-sm text-muted-foreground">
                          ไม่มีสมาชิกในกลุ่มนี้
                        </p>
                      ) : (
                        groupMeta?.members.map((member) => {
                          const isSelected = selectedMembers.has(
                            member.personId,
                          );
                          return (
                            <label
                              key={member.personId}
                              className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) =>
                                  toggleMember(
                                    member.personId,
                                    e.target.checked,
                                  )
                                }
                              />
                              <span
                                className={
                                  isSelected ? "font-medium" : undefined
                                }
                              >
                                {member.label}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {validationError ? (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}
    </div>
  );
});
