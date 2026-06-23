import {
  validateMailAttachmentFileClient,
  validateMailAttachmentsTotalBytes,
} from "@/lib/mail/attachment-constants";

export type ComposeAttachment = {
  file: File;
  fileDes: string;
};

export function toComposeAttachments(
  items: { file: File; description: string; error?: string }[],
): ComposeAttachment[] {
  return items
    .filter((item) => !item.error)
    .map((item) => ({
      file: item.file,
      fileDes: item.description.trim(),
    }));
}

export function validateComposeAttachments(
  items: { file: File; description: string; error?: string }[],
): string | null {
  for (const item of items) {
    if (item.error) {
      return item.error;
    }
    const message = validateMailAttachmentFileClient(item.file);
    if (message) return message;
  }

  const validFiles = items.filter((item) => !item.error).map((item) => item.file);
  return validateMailAttachmentsTotalBytes(validFiles);
}

export function buildMailComposeFormData(form: HTMLFormElement) {
  return new FormData(form);
}

export async function uploadComposeAttachments(
  documentId: number,
  attachments: ComposeAttachment[],
  onProgress?: (done: number, total: number) => void,
) {
  const total = attachments.length;

  for (let index = 0; index < attachments.length; index++) {
    const attachment = attachments[index]!;
    const form = new FormData();
    form.set("file", attachment.file);
    if (attachment.fileDes) {
      form.set("fileDes", attachment.fileDes);
    }

    const res = await fetch(`/api/mail/${documentId}/files`, {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.message ?? "แนบไฟล์ไม่สำเร็จ");
    }

    onProgress?.(index + 1, total);
  }
}
