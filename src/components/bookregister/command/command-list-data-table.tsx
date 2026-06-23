"use client";

import type { DistrictCommandRow } from "@/lib/bookregister/command/queries";
import { BookregisterListDataTable } from "@/components/bookregister/bookregister-list-data-table";
import { commandColumns } from "./columns";
import {
  COMMAND_COLUMN_SIZING_STORAGE_KEY,
  DEFAULT_COMMAND_COLUMN_SIZING,
} from "./default-column-sizing";

type CommandListDataTableProps = {
  rows: DistrictCommandRow[];
  caption?: string;
};

export function CommandListDataTable({
  rows,
  caption = "ทะเบียนคำสั่ง",
}: CommandListDataTableProps) {
  return (
    <BookregisterListDataTable
      rows={rows}
      columns={commandColumns}
      caption={caption}
      storageKey={COMMAND_COLUMN_SIZING_STORAGE_KEY}
      defaultSizing={DEFAULT_COMMAND_COLUMN_SIZING}
    />
  );
}
