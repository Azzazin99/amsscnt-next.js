export type ObecPendingItem = {
  msId: string;
  bookno: string;
  subject: string;
  detail: string;
  signdate: string;
  level: string;
  refId: string;
  sendDate: string;
  office: string;
};

export type ObecPendingFeed = {
  alertText: string;
  bookActive: boolean;
  items: ObecPendingItem[];
};

function decodeObecField(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return Buffer.from(trimmed, "base64").toString("utf8");
  } catch {
    return trimmed;
  }
}

function readObecTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

/** ponytail: flat XML only — no DOM dependency */
export function parseObecPendingXml(xml: string): ObecPendingFeed {
  const alertText = decodeObecField(readObecTag(xml, "office_code"));
  const bookActive = decodeObecField(readObecTag(xml, "book_active")) === "1";

  const items: ObecPendingItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      msId: decodeObecField(readObecTag(block, "ms_id")),
      bookno: decodeObecField(readObecTag(block, "bookno")),
      subject: decodeObecField(readObecTag(block, "subject")),
      detail: decodeObecField(readObecTag(block, "detail")),
      signdate: decodeObecField(readObecTag(block, "signdate")),
      level: decodeObecField(readObecTag(block, "level")),
      refId: decodeObecField(readObecTag(block, "ref_id")),
      sendDate: decodeObecField(readObecTag(block, "send_date")),
      office: decodeObecField(readObecTag(block, "office")),
    });
  }

  return { alertText, bookActive, items };
}
