import type { BookregisterColumnSizing } from "@/components/bookregister/bookregister-list-column";
import { BOOKREGISTER_ACTION_COLUMN_WIDTH } from "@/components/bookregister/bookregister-column-sizing";

export const COMMAND_COLUMN_SIZING_STORAGE_KEY =
  "amss:bookregister-command:column-sizing:v1";

export const DEFAULT_COMMAND_COLUMN_SIZING: BookregisterColumnSizing = {
  registerNumber: 56,
  year: 64,
  bookNo: 88,
  signdate: 88,
  subject: 280,
  comment: 88,
  registerDate: 88,
  officer: 120,
  actionView: BOOKREGISTER_ACTION_COLUMN_WIDTH,
  actionEdit: BOOKREGISTER_ACTION_COLUMN_WIDTH,
  actionDelete: BOOKREGISTER_ACTION_COLUMN_WIDTH,
};
