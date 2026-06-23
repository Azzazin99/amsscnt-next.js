"use client";

import type { DistrictCertificateRow } from "@/lib/bookregister/certificate/queries";
import { BookregisterListDataTable } from "@/components/bookregister/bookregister-list-data-table";
import { certificateColumns } from "@/components/bookregister/certificate/columns";
import {
  CERTIFICATE_COLUMN_SIZING_STORAGE_KEY,
  DEFAULT_CERTIFICATE_COLUMN_SIZING,
} from "@/components/bookregister/certificate/default-column-sizing";

type CertificateListDataTableProps = {
  rows: DistrictCertificateRow[];
  caption?: string;
};

export function CertificateListDataTable({
  rows,
  caption = "ทะเบียนเกียรติบัตร",
}: CertificateListDataTableProps) {
  return (
    <BookregisterListDataTable
      rows={rows}
      columns={certificateColumns}
      caption={caption}
      storageKey={CERTIFICATE_COLUMN_SIZING_STORAGE_KEY}
      defaultSizing={DEFAULT_CERTIFICATE_COLUMN_SIZING}
    />
  );
}

