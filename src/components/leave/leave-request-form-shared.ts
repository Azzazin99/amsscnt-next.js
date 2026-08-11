import { cn } from "@/lib/utils";
import type { HalfDayPeriod } from "@/lib/leave/regulation/types";
import {
  STANDARD_ATTACHMENT_ACCEPT,
  STANDARD_ATTACHMENT_EXTENSION_SET,
  isAllowedAttachmentFileName,
} from "@/lib/form/attachment-allowed-types";

export const LEAVE_FORM_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const LEAVE_FORM_INLINE_INPUT_CLASS =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const LEAVE_ATTACHMENT_ACCEPT = STANDARD_ATTACHMENT_ACCEPT;

export const LEAVE_ATTACHMENT_EXTENSIONS = STANDARD_ATTACHMENT_EXTENSION_SET;

export function withFieldError(
  className: string,
  fieldErrors: Record<string, string>,
  name: string,
) {
  return cn(className, fieldErrors[name] && "border-destructive");
}

export function isAllowedLeaveAttachmentName(fileName: string): boolean {
  return isAllowedAttachmentFileName(fileName);
}

export function formatLeaveDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function resolveHalfDayPeriod(
  halfDay: boolean,
  halfDayPeriod: string,
): HalfDayPeriod | null {
  if (!halfDay) return null;
  if (halfDayPeriod === "morning" || halfDayPeriod === "afternoon") {
    return halfDayPeriod;
  }
  return null;
}
