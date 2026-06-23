import type { BookregisterColumnSizing } from "@/components/bookregister/bookregister-list-column";
import { BOOKREGISTER_ACTION_COLUMN_WIDTH } from "@/components/bookregister/bookregister-column-sizing";

export const SEND_COLUMN_SIZING_STORAGE_KEY =
  "amss:bookregister-send:column-sizing:v9";

export const DEFAULT_SEND_COLUMN_SIZING: BookregisterColumnSizing = {
  registerNumber: 56,
  year: 64,
  bookNo: 104,
  signdate: 88,
  bookFrom: 128,
  bookTo: 128,
  subject: 280,
  workgroup: 112,
  operation: 96,
  comment: 88,
  registerDate: 88,
  actionView: BOOKREGISTER_ACTION_COLUMN_WIDTH,
  actionEdit: BOOKREGISTER_ACTION_COLUMN_WIDTH,
  actionDelete: BOOKREGISTER_ACTION_COLUMN_WIDTH,
};
