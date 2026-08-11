import "server-only";

import {
  buildObecIframeUrl,
  fetchObecPendingFeed,
  type ObecPendingItem,
} from "@/lib/bookobec/obec-client";
import { resolveObecSenderOffice } from "@/lib/bookobec/obec-offices";
import { isBookobecModuleAdmin } from "@/lib/bookobec/permissions";
import type { BookobecPermissionFlags } from "@/lib/bookobec/permissions";
import {
  getSystemSyncCode,
  isSyncCodeConfigured,
} from "@/lib/bookobec/sync-code";
import type { BookobecPendingRow } from "@/components/bookobec/bookobec-pending-inbox";
import type { AmssSessionUser } from "@/types/next-auth";

export type BookobecInboxData = {
  syncConfigured: boolean;
  canReceive: boolean;
  canReceiveRegister: boolean;
  alertText: string;
  pendingItems: BookobecPendingRow[];
  fetchError: string | null;
  receiveIframeUrl: string | null;
  receiveOtherIframeUrl: string | null;
};

async function mapPendingRows(
  items: ObecPendingItem[],
): Promise<BookobecPendingRow[]> {
  const rows: BookobecPendingRow[] = [];

  for (const item of items) {
    const sender = await resolveObecSenderOffice(item.office);
    rows.push({
      msId: item.msId,
      bookno: item.bookno,
      subject: item.subject,
      signdate: item.signdate,
      sendDate: item.sendDate,
      senderName: sender.senderName,
      detailUrl: `https://smart.obec.go.th/modules/book/xml/bookobec_detail2.php?b_id=${encodeURIComponent(item.msId)}`,
    });
  }

  return rows;
}

export async function getBookobecInboxData(
  user: AmssSessionUser,
  perms: BookobecPermissionFlags,
): Promise<BookobecInboxData> {
  const syncRow = await getSystemSyncCode();
  const syncConfigured = isSyncCodeConfigured(syncRow);
  const isAdmin = isBookobecModuleAdmin(user);
  const canReceive = isAdmin || perms.p1 === 1;
  const canReceiveRegister = canReceive;

  if (!syncConfigured || !syncRow) {
    return {
      syncConfigured: false,
      canReceive,
      canReceiveRegister,
      alertText: "",
      pendingItems: [],
      fetchError: "ยังไม่ได้ตั้งค่ารหัสเชื่อม สพฐ.",
      receiveIframeUrl: null,
      receiveOtherIframeUrl: null,
    };
  }

  const auth = {
    officeCode: syncRow.officeCode,
    syncCode: syncRow.syncCode,
    personId: user.personId,
  };

  let alertText = "";
  let pendingItems: BookobecPendingRow[] = [];
  let fetchError: string | null = null;

  if (canReceiveRegister) {
    const feedResult = await fetchObecPendingFeed(auth);
    if (feedResult.ok) {
      alertText = feedResult.feed.alertText;
      if (feedResult.feed.bookActive) {
        pendingItems = await mapPendingRows(feedResult.feed.items);
      }
    } else {
      fetchError = feedResult.message;
    }
  }

  return {
    syncConfigured: true,
    canReceive,
    canReceiveRegister,
    alertText,
    pendingItems,
    fetchError,
    receiveIframeUrl: canReceive
      ? buildObecIframeUrl("receive", auth)
      : null,
    receiveOtherIframeUrl: buildObecIframeUrl("receive_other", auth),
  };
}

export type BookobecSentData = {
  syncConfigured: boolean;
  canSend: boolean;
  fetchError: string | null;
  sendIframeUrl: string | null;
  sendReportIframeUrl: string | null;
};

export async function getBookobecSentData(
  user: AmssSessionUser,
  perms: BookobecPermissionFlags,
): Promise<BookobecSentData> {
  const syncRow = await getSystemSyncCode();
  const syncConfigured = isSyncCodeConfigured(syncRow);
  const canSend = isBookobecModuleAdmin(user) || perms.p2 === 1;

  if (!syncConfigured || !syncRow) {
    return {
      syncConfigured: false,
      canSend,
      fetchError: "ยังไม่ได้ตั้งค่ารหัสเชื่อม สพฐ.",
      sendIframeUrl: null,
      sendReportIframeUrl: null,
    };
  }

  const auth = {
    officeCode: syncRow.officeCode,
    syncCode: syncRow.syncCode,
    personId: user.personId,
  };

  return {
    syncConfigured: true,
    canSend,
    fetchError: null,
    sendIframeUrl: canSend ? buildObecIframeUrl("send", auth) : null,
    sendReportIframeUrl: buildObecIframeUrl("send_report", auth),
  };
}
