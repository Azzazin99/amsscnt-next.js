import { createHash } from "node:crypto";
import {
  parseObecPendingXml,
  type ObecPendingFeed,
} from "@/lib/bookobec/obec-xml-parse";

const OBEC_XML_BASE = "https://smart.obec.go.th/modules/book/xml";

export type ObecIframeKind =
  | "receive"
  | "receive_other"
  | "send"
  | "send_report"
  | "detail";

export type ObecAuth = {
  officeCode: string;
  syncCode: string;
  personId: string;
};

function md5SyncCode(syncCode: string): string {
  return createHash("md5").update(syncCode).digest("hex");
}

function buildObecUrl(
  path: string,
  auth: ObecAuth,
  extra?: Record<string, string>,
): string {
  const syncCode2 = md5SyncCode(auth.syncCode);
  const params = new URLSearchParams({
    office_code: ` ${auth.officeCode}`,
    sync_code2: syncCode2,
    person: auth.personId,
    ...extra,
  });

  return `${OBEC_XML_BASE}/${path}?${params.toString()}`;
}

export function buildObecPendingUrl(auth: ObecAuth): string {
  const syncCode2 = md5SyncCode(auth.syncCode);
  const params = new URLSearchParams({
    office_code: ` ${auth.officeCode}`,
    sync_code: "",
    sync_code2: syncCode2,
    person: auth.personId,
  });
  return `${OBEC_XML_BASE}/bookobec.php?${params.toString()}`;
}

export function buildObecIframeUrl(
  kind: ObecIframeKind,
  auth: ObecAuth,
  extra?: Record<string, string>,
): string {
  switch (kind) {
    case "receive":
      return buildObecUrl("receive_bookobec.php", auth, extra);
    case "receive_other":
      return buildObecUrl("receive_bookobec_other.php", auth, extra);
    case "send":
      return buildObecUrl("send_bookobec.php", auth, extra);
    case "send_report":
      return buildObecUrl("send_report_bookobec.php", auth, extra);
    case "detail":
      return buildObecUrl("bookobec_detail2.php", auth, extra);
  }
}

export async function fetchObecPendingFeed(
  auth: ObecAuth,
): Promise<
  | { ok: true; feed: ObecPendingFeed }
  | { ok: false; message: string }
> {
  const url = buildObecPendingUrl(auth);

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/xml,text/xml,*/*" },
    });
  } catch {
    return { ok: false, message: "เชื่อมต่อ smart.obec.go.th ไม่ได้" };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `smart.obec.go.th ตอบกลับ HTTP ${response.status}`,
    };
  }

  const xml = await response.text();
  return { ok: true, feed: parseObecPendingXml(xml) };
}
