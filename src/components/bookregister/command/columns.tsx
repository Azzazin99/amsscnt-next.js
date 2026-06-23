"use client";

import { Eye, Paperclip, Pencil } from "lucide-react";
import { bookregisterActionColumnBase } from "@/components/bookregister/bookregister-column-sizing";
import type { BookregisterListColumn } from "@/components/bookregister/bookregister-list-column";
import { TableActionLink } from "@/components/bookregister/table-action-link";
import { CommandDeleteButton } from "@/components/bookregister/command/command-delete-button";
import type { DistrictCommandRow } from "@/lib/bookregister/command/queries";
import { formatThaiDateCompact } from "@/lib/format/thai-date";

export const COMMAND_HEADERS = {
  registerNumber: "เลขทะเบียน\u200Bคำสั่ง",
  year: "ปี",
  bookNo: "เลขที่",
  signdate: "สั่ง\u200Bณ\u200Bวันที่",
  subject: "เรื่อง",
  comment: "หมายเหตุ",
  registerDate: "วันลง\u200Bทะเบียน",
  officer: "ผู้ลง\u200Bทะเบียน",
  actionView: "ดู",
  actionEdit: "แก้ไข",
  actionDelete: "ลบ",
} as const;

function commandRowLabel(row: DistrictCommandRow) {
  return `เลขทะเบียนคำสั่ง ${row.registerNumber}/${row.year}`;
}

const actionEmptyCell = (
  <span className="block text-center text-muted-foreground" aria-hidden>
    —
  </span>
);

export const commandColumns: BookregisterListColumn<DistrictCommandRow>[] = [
  {
    id: "registerNumber",
    header: COMMAND_HEADERS.registerNumber,
    defaultWidth: 56,
    minWidth: 48,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center">{row.registerNumber}</span>
    ),
  },
  {
    id: "year",
    header: COMMAND_HEADERS.year,
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
    header: COMMAND_HEADERS.bookNo,
    defaultWidth: 88,
    minWidth: 72,
    render: (row) => (
      <>
        {row.bookNo || "—"}
        {row.hasAttachment ? (
          <Paperclip
            className="ml-1 inline size-3.5 text-muted-foreground"
            aria-label="มีไฟล์แนบ"
          />
        ) : null}
      </>
    ),
  },
  {
    id: "signdate",
    header: COMMAND_HEADERS.signdate,
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
    id: "subject",
    header: COMMAND_HEADERS.subject,
    defaultWidth: 280,
    minWidth: 120,
    render: (row) => row.subject || "",
  },
  {
    id: "comment",
    header: COMMAND_HEADERS.comment,
    defaultWidth: 88,
    minWidth: 64,
    render: (row) => row.comment || "",
  },
  {
    id: "registerDate",
    header: COMMAND_HEADERS.registerDate,
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
    id: "officer",
    header: COMMAND_HEADERS.officer,
    defaultWidth: 120,
    minWidth: 80,
    render: (row) => row.officerName || "—",
  },
  {
    id: "actionView",
    header: COMMAND_HEADERS.actionView,
    ...bookregisterActionColumnBase,
    render: (row) => {
      const label = commandRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/command/${row.id}`}
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
    header: COMMAND_HEADERS.actionEdit,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canEdit) return actionEmptyCell;
      const label = commandRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/command/${row.id}/edit`}
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
    header: COMMAND_HEADERS.actionDelete,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canDelete) return actionEmptyCell;
      const label = commandRowLabel(row);
      return (
        <CommandDeleteButton id={row.id} ariaLabel={`ลบ ${label}`} />
      );
    },
  },
];
