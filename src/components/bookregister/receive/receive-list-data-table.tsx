"use client";

import type { DistrictReceiveRow } from "@/lib/bookregister/receive/queries";
import { BookregisterListDataTable } from "@/components/bookregister/bookregister-list-data-table";
import { receiveColumns } from "./columns";
import {
  DEFAULT_RECEIVE_COLUMN_SIZING,
  RECEIVE_COLUMN_SIZING_STORAGE_KEY,
} from "./default-column-sizing";

type ReceiveListDataTableProps = {
  rows: DistrictReceiveRow[];
  caption?: string;
};

export function ReceiveListDataTable({
  rows,
  caption = "ทะเบียนหนังสือรับ",
}: ReceiveListDataTableProps) {
  return (
    <BookregisterListDataTable
      rows={rows}
      columns={receiveColumns}
      caption={caption}
      storageKey={RECEIVE_COLUMN_SIZING_STORAGE_KEY}
      defaultSizing={DEFAULT_RECEIVE_COLUMN_SIZING}
    />
  );
}
