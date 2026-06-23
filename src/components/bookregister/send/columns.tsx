"use client";

import { Eye, Paperclip, Pencil } from "lucide-react";
import { bookregisterActionColumnBase } from "@/components/bookregister/bookregister-column-sizing";
import type { BookregisterListColumn } from "@/components/bookregister/bookregister-list-column";
import { TableActionLink } from "@/components/bookregister/table-action-link";
import { SendDeleteButton } from "@/components/bookregister/send/send-delete-button";
import type { DistrictSendRow } from "@/lib/bookregister/send/queries";
import { cleanLegacyText } from "@/lib/format/clean-text";
import { formatThaiDateCompact } from "@/lib/format/thai-date";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import {
  officeTypeMark,
  secretLevelLabel,
} from "@/lib/bookregister/regulation-fields";

export const SEND_HEADERS = {
  registerNumber: "เลขทะเบียน\u200Bส่ง",
  year: "ปี",
  bookNo: "ที่",
  signdate: "ลง\u200Bวันที่",
  bookFrom: "จาก",
  bookTo: "ถึง",
  subject: "เรื่อง",
  workgroup: "กลุ่ม\u200Bปฏิบัติ",
  operation: "การ\u200Bปฏิบัติ",
  comment: "หมายเหตุ",
  registerDate: "วันลง\u200Bทะเบียน",
  actionView: "ดู",
  actionEdit: "แก้ไข",
  actionDelete: "ลบ",
} as const;

function sendRowLabel(row: DistrictSendRow) {
  return `เลขทะเบียนส่ง ${row.registerNumber}/${row.year}`;
}

const actionEmptyCell = (
  <span className="block text-center text-muted-foreground" aria-hidden>
    —
  </span>
);

export const sendColumns: BookregisterListColumn<DistrictSendRow>[] = [
  {
    id: "registerNumber",
    header: SEND_HEADERS.registerNumber,
    defaultWidth: 56,
    minWidth: 48,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center">{row.registerNumber}</span>
    ),
  },
  {
    id: "year",
    header: SEND_HEADERS.year,
    defaultWidth: 64,
    minWidth: 64,
    maxWidth: 64,
    resizable: false,
    headerNowrap: true,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center whitespace-nowrap">{row.year}</span>
    ),
  },
  {
    id: "bookNo",
    header: SEND_HEADERS.bookNo,
    defaultWidth: 104,
    minWidth: 72,
    render: (row) => (
      <>
        {row.bookNo || "—"}
        <UrgencyLevelBadge level={row.urgencyLevel} />
      </>
    ),
  },
  {
    id: "signdate",
    header: SEND_HEADERS.signdate,
    defaultWidth: 88,
    minWidth: 72,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center">
        {formatThaiDateCompact(row.signdate) || "—"}
      </span>
    ),
  },
  {
    id: "bookFrom",
    header: SEND_HEADERS.bookFrom,
    defaultWidth: 128,
    minWidth: 80,
    render: (row) => cleanLegacyText(row.bookFrom) || "—",
  },
  {
    id: "bookTo",
    header: SEND_HEADERS.bookTo,
    defaultWidth: 128,
    minWidth: 80,
    render: (row) => cleanLegacyText(row.bookTo) || "—",
  },
  {
    id: "subject",
    header: SEND_HEADERS.subject,
    defaultWidth: 280,
    minWidth: 120,
    render: (row) => (
      <>
        {row.subject?.trim() || "—"}
        <span
          className="ml-1 text-xs text-muted-foreground"
          title="ประเภทหนังสือ"
        >
          [{officeTypeMark(row.officeType)}]
        </span>
        {row.forwardedToSchools ? (
          <span className="ml-1 text-xs text-primary" title="ส่งต่อโรงเรียน">
            [ส่งต่อ]
          </span>
        ) : null}
        {row.hasAttachment ? (
          <Paperclip
            className="ml-1 inline size-3.5 shrink-0 text-muted-foreground"
            aria-label="มีไฟล์แนบ"
          />
        ) : null}
        {row.secretLevel > 0 ? (
          <span className="ml-1 text-destructive">
            [{secretLevelLabel(row.secretLevel)}]
          </span>
        ) : null}
      </>
    ),
  },
  {
    id: "workgroup",
    header: SEND_HEADERS.workgroup,
    defaultWidth: 112,
    minWidth: 72,
    render: (row) => row.workgroupName || "",
  },
  {
    id: "operation",
    header: SEND_HEADERS.operation,
    defaultWidth: 96,
    minWidth: 72,
    render: (row) => row.operation || "",
  },
  {
    id: "comment",
    header: SEND_HEADERS.comment,
    defaultWidth: 88,
    minWidth: 64,
    render: (row) => row.comment || "",
  },
  {
    id: "registerDate",
    header: SEND_HEADERS.registerDate,
    defaultWidth: 88,
    minWidth: 72,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center">
        {formatThaiDateCompact(row.registerDate) || "—"}
      </span>
    ),
  },
  {
    id: "actionView",
    header: SEND_HEADERS.actionView,
    ...bookregisterActionColumnBase,
    render: (row) => {
      const label = sendRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/send/${row.id}`}
          aria-label={`ดูรายละเอียด ${label}`}
          title="ดู"
        >
          <Eye className="size-4" aria-hidden />
        </TableActionLink>
      );
    },
  },
  {
    id: "actionEdit",
    header: SEND_HEADERS.actionEdit,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canEdit) return actionEmptyCell;
      const label = sendRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/send/${row.id}/edit`}
          aria-label={`แก้ไข ${label}`}
          title="แก้ไข"
        >
          <Pencil className="size-4" aria-hidden />
        </TableActionLink>
      );
    },
  },
  {
    id: "actionDelete",
    header: SEND_HEADERS.actionDelete,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canDelete) return actionEmptyCell;
      const label = sendRowLabel(row);
      return (
        <SendDeleteButton id={row.id} ariaLabel={`ลบ ${label}`} />
      );
    },
  },
];
