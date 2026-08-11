"use client";

import {
  AttachmentPicker,
  type PendingAttachment,
} from "@/components/shared/attachment-picker";
import { buildStandardAttachmentUploadHint } from "@/lib/form/attachment-allowed-types";
import {
  MAIL_COMPOSE_FILE_ACCEPT,
  MAIL_MAX_TOTAL_ATTACHMENT_BYTES,
  validateMailAttachmentFileClient,
} from "@/lib/mail/attachment-constants";
import { formatFileSize } from "@/lib/format/file-size";

type Props = {
  value: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
};

export function MailComposeAttachments({ value, onChange }: Props) {
  return (
    <AttachmentPicker
      value={value}
      onChange={onChange}
      maxTotalBytes={MAIL_MAX_TOTAL_ATTACHMENT_BYTES}
      accept={MAIL_COMPOSE_FILE_ACCEPT}
      validate={validateMailAttachmentFileClient}
      hint={buildStandardAttachmentUploadHint(
        formatFileSize(MAIL_MAX_TOTAL_ATTACHMENT_BYTES),
      )}
    />
  );
}

export type { PendingAttachment };
