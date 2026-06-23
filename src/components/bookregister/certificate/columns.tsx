"use client";

import { Eye, Paperclip, Pencil } from "lucide-react";
import { bookregisterActionColumnBase } from "@/components/bookregister/bookregister-column-sizing";
import type { BookregisterListColumn } from "@/components/bookregister/bookregister-list-column";
import { TableActionLink } from "@/components/bookregister/table-action-link";
import { CertificateDeleteButton } from "@/components/bookregister/certificate/certificate-delete-button";
import type { DistrictCertificateRow } from "@/lib/bookregister/certificate/queries";
import { formatThaiDateCompact } from "@/lib/format/thai-date";
import { UrgencyLevelBadge } from "@/components/bookregister/urgency-level-badge";
import { secretLevelLabel } from "@/lib/bookregister/regulation-fields";

export const CERTIFICATE_HEADERS = {
  registerNumber: "เลขทะเบียน\u200Bเกียรติบัตร",
  year: "ปี",
  bookNo: "เลขที่",
  signdate: "ลง\u200Bวันที่",
  subject: "เรื่อง",
  comment: "หมายเหตุ",
  registerDate: "วันลง\u200Bทะเบียน",
  officer: "ผู้ลง\u200Bทะเบียน",
  actionView: "ดู",
  actionEdit: "แก้ไข",
  actionDelete: "ลบ",
} as const;

function certificateRowLabel(row: DistrictCertificateRow) {
  return `เลขทะเบียนเกียรติบัตร ${row.registerNumber}/${row.year}`;
}

const actionEmptyCell = (
  <span className="block text-center text-muted-foreground" aria-hidden>
    —
  </span>
);

export const certificateColumns: BookregisterListColumn<
  DistrictCertificateRow
>[] = [
  {
    id: "registerNumber",
    header: CERTIFICATE_HEADERS.registerNumber,
    defaultWidth: 56,
    minWidth: 48,
    alignCenter: true,
    render: (row) => (
      <span className="block text-center">{row.registerNumber}</span>
    ),
  },
  {
    id: "year",
    header: CERTIFICATE_HEADERS.year,
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
    header: CERTIFICATE_HEADERS.bookNo,
    defaultWidth: 88,
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
    header: CERTIFICATE_HEADERS.signdate,
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
    header: CERTIFICATE_HEADERS.subject,
    defaultWidth: 280,
    minWidth: 120,
    render: (row) => (
      <>
        {row.subject?.trim() || "—"}
        {row.secretLevel > 0 ? (
          <span className="ml-1 text-xs text-destructive">
            [{secretLevelLabel(row.secretLevel)}]
          </span>
        ) : null}
        {row.hasAttachment ? (
          <Paperclip
            className="ml-1 inline size-3.5 shrink-0 text-muted-foreground"
            aria-label="มีไฟล์แนบ"
          />
        ) : null}
      </>
    ),
  },
  {
    id: "comment",
    header: CERTIFICATE_HEADERS.comment,
    defaultWidth: 88,
    minWidth: 64,
    render: (row) => row.comment || "",
  },
  {
    id: "registerDate",
    header: CERTIFICATE_HEADERS.registerDate,
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
    header: CERTIFICATE_HEADERS.officer,
    defaultWidth: 120,
    minWidth: 80,
    render: (row) => row.officerName || "—",
  },
  {
    id: "actionView",
    header: CERTIFICATE_HEADERS.actionView,
    ...bookregisterActionColumnBase,
    render: (row) => {
      const label = certificateRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/certificate/${row.id}`}
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
    header: CERTIFICATE_HEADERS.actionEdit,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canEdit) return actionEmptyCell;
      const label = certificateRowLabel(row);
      return (
        <TableActionLink
          variant="icon"
          href={`/modules/bookregister/certificate/${row.id}/edit`}
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
    header: CERTIFICATE_HEADERS.actionDelete,
    ...bookregisterActionColumnBase,
    render: (row) => {
      if (!row.canDelete) return actionEmptyCell;
      const label = certificateRowLabel(row);
      return (
        <CertificateDeleteButton
          id={row.id}
          ariaLabel={`ลบ ${label}`}
        />
      );
    },
  },
];

