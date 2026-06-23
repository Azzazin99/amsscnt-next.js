"use client";

import type { DistrictSendRow } from "@/lib/bookregister/send/queries";
import { BookregisterListDataTable } from "@/components/bookregister/bookregister-list-data-table";
import { sendColumns } from "./columns";
import {
  DEFAULT_SEND_COLUMN_SIZING,
  SEND_COLUMN_SIZING_STORAGE_KEY,
} from "./default-column-sizing";

type SendListDataTableProps = {
  rows: DistrictSendRow[];
  caption?: string;
};

export function SendListDataTable({
  rows,
  caption = "ทะเบียนหนังสือส่ง",
}: SendListDataTableProps) {
  return (
    <BookregisterListDataTable
      rows={rows}
      columns={sendColumns}
      caption={caption}
      storageKey={SEND_COLUMN_SIZING_STORAGE_KEY}
      defaultSizing={DEFAULT_SEND_COLUMN_SIZING}
    />
  );
}
