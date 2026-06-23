import {
  officeTypeMark,
  secretLevelLabel,
  urgencyLevelLabel,
} from "@/lib/bookregister/regulation-fields";
import type {
  CommandReportRow,
  ReceiveReportRow,
  SendReportRow,
} from "@/lib/bookregister/reports/queries";
import { cleanLegacyText } from "@/lib/format/clean-text";
import { formatThaiDateCompact } from "@/lib/format/thai-date";

function text(value: string | null | undefined): string {
  const cleaned = cleanLegacyText(value ?? "");
  return cleaned || "";
}

function date(value: string | null | undefined): string {
  return formatThaiDateCompact(value) || "";
}

export function formatReceiveReportCells(
  row: ReceiveReportRow,
  seq: number,
): Record<string, string> {
  const secretSuffix =
    row.secretLevel > 0 ? ` [${secretLevelLabel(row.secretLevel)}]` : "";

  return {
    seq: String(seq),
    registerNumber: String(row.registerNumber),
    year: String(row.year),
    bookNo: text(row.bookNo),
    signdate: date(row.signdate),
    bookFrom: text(row.bookFrom),
    bookTo: text(row.bookTo),
    subject: `${text(row.subject)}${secretSuffix}`.trim(),
    urgencyLevel: urgencyLevelLabel(row.urgencyLevel),
    secretLevel: secretLevelLabel(row.secretLevel),
    registerDate: date(row.registerDate),
    comment: text(row.comment),
    workgroupName: text(row.workgroupName),
    operation: text(row.operation),
  };
}

export function formatSendReportCells(
  row: SendReportRow,
  seq: number,
): Record<string, string> {
  const base = formatReceiveReportCells(row, seq);
  const mark = officeTypeMark(row.officeType);

  return {
    ...base,
    officeType: mark || "ป",
  };
}

export function formatCommandReportCells(
  row: CommandReportRow,
  seq: number,
): Record<string, string> {
  return {
    seq: String(seq),
    registerNumber: String(row.registerNumber),
    year: String(row.year),
    bookNo: text(row.bookNo),
    subject: text(row.subject),
    signdate: date(row.signdate),
    comment: text(row.comment),
    registerDate: date(row.registerDate),
  };
}
