import type { LeaveTypeId } from "@/lib/leave/regulation/types";
import { LEAVE_TYPES } from "@/lib/leave/regulation/types";

const STATS_LEAVE_TYPES = [1, 2, 3, 4] as const;
export type StatsLeaveTypeId = (typeof STATS_LEAVE_TYPES)[number];

export type LeaveStatRow = {
  leaveType: StatsLeaveTypeId;
  label: string;
  ago: number;
  thisTime: number;
  total: number;
};

export type LeaveStatisticsSnapshot = {
  rows: LeaveStatRow[];
  relaxCollect: number | null;
  relaxThisYear: number | null;
};

export type LastLeaveInfo = {
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
};

export type LeaveApproverOption = {
  personId: string;
  displayName: string;
};

export type LeaveRequesterProfile = {
  displayName: string;
  positionLabel: string;
};

export function buildLeaveStatisticsSnapshot(
  agoByType: Record<StatsLeaveTypeId, number>,
  selectedLeaveType: LeaveTypeId,
  leaveTotal: number,
  relaxCollect: number | null,
  relaxThisYear: number | null,
): LeaveStatisticsSnapshot {
  const rows: LeaveStatRow[] = STATS_LEAVE_TYPES.map((typeId) => {
    const ago = agoByType[typeId];
    const thisTime = selectedLeaveType === typeId ? leaveTotal : 0;
    return {
      leaveType: typeId,
      label: LEAVE_TYPES[typeId].label,
      ago,
      thisTime,
      total: ago + thisTime,
    };
  });

  return { rows, relaxCollect, relaxThisYear };
}
