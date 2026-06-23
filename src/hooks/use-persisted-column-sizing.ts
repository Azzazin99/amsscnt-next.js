"use client";

import type { BookregisterColumnSizing } from "@/components/bookregister/bookregister-list-column";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** อ้างอิงคงที่ — อย่าใช้ `{}` ใน default param (สร้างใหม่ทุก render → loop) */
export const BOOKREGISTER_NO_LOCKED_SIZING: BookregisterColumnSizing =
  Object.freeze({});

type UsePersistedColumnSizingOptions = {
  storageKey: string;
  defaultSizing: BookregisterColumnSizing;
  lockedSizing?: BookregisterColumnSizing;
};

type UsePersistedColumnSizingResult = {
  columnSizing: BookregisterColumnSizing;
  setColumnWidth: (columnId: string, width: number) => void;
  resetColumnSizing: () => void;
};

function mergeSizing(
  defaultSizing: BookregisterColumnSizing,
  persisted: BookregisterColumnSizing | undefined,
  lockedSizing: BookregisterColumnSizing,
): BookregisterColumnSizing {
  return { ...defaultSizing, ...persisted, ...lockedSizing };
}

function omitLockedKeys(
  sizing: BookregisterColumnSizing,
  lockedSizing: BookregisterColumnSizing,
): BookregisterColumnSizing {
  const lockedKeys = new Set(Object.keys(lockedSizing));
  return Object.fromEntries(
    Object.entries(sizing).filter(([key]) => !lockedKeys.has(key)),
  );
}

export function usePersistedColumnSizing({
  storageKey,
  defaultSizing,
  lockedSizing = BOOKREGISTER_NO_LOCKED_SIZING,
}: UsePersistedColumnSizingOptions): UsePersistedColumnSizingResult {
  const defaultSizingRef = useRef(defaultSizing);
  const lockedSizingRef = useRef(lockedSizing);
  defaultSizingRef.current = defaultSizing;
  lockedSizingRef.current = lockedSizing;

  const baselineSizing = useMemo(
    () => mergeSizing(defaultSizing, undefined, lockedSizing),
    [defaultSizing, lockedSizing],
  );

  const [columnSizing, setColumnSizingState] =
    useState<BookregisterColumnSizing>(baselineSizing);
  const [hydrated, setHydrated] = useState(false);

  const applyLocked = useCallback((sizing: BookregisterColumnSizing) => {
    return mergeSizing(
      defaultSizingRef.current,
      sizing,
      lockedSizingRef.current,
    );
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as BookregisterColumnSizing;
        if (parsed && typeof parsed === "object") {
          setColumnSizingState(
            mergeSizing(
              defaultSizingRef.current,
              parsed,
              lockedSizingRef.current,
            ),
          );
        }
      }
    } catch {
      // ignore invalid stored value
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(
            omitLockedKeys(columnSizing, lockedSizingRef.current),
          ),
        );
      } catch {
        // ignore quota / private mode errors
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [columnSizing, hydrated, storageKey]);

  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      setColumnSizingState((prev) =>
        applyLocked({ ...prev, [columnId]: Math.round(width) }),
      );
    },
    [applyLocked],
  );

  const resetColumnSizing = useCallback(() => {
    setColumnSizingState(baselineSizing);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [baselineSizing, storageKey]);

  return { columnSizing, setColumnWidth, resetColumnSizing };
}
