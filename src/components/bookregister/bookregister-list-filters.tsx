"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  canCommitRegisterListQuery,
  MIN_REGISTER_LIST_QUERY_LENGTH,
} from "@/lib/bookregister/build-register-list-search";
import {
  buildListSearchUrl,
  listSearchUrlMatches,
} from "@/lib/bookregister/list-search-params";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;
const WORKGROUP_SELECT_EXTRA_CH = 4;
const WORKGROUP_SELECT_MAX_CH = 48;

type WorkgroupOption = { id: number; name: string };

function longestWorkgroupLabelCh(workgroups: WorkgroupOption[]): number {
  const labels = ["ทุกกลุ่ม(งาน)", ...workgroups.map((w) => w.name)];
  const longest = labels.reduce(
    (max, label) => Math.max(max, label.length),
    0,
  );
  return Math.min(longest + WORKGROUP_SELECT_EXTRA_CH, WORKGROUP_SELECT_MAX_CH);
}

type BookregisterListFiltersProps = {
  basePath: string;
  q: string;
  workgroupId?: number;
  workgroups: WorkgroupOption[];
  workgroupLabelId: string;
  showWorkgroup?: boolean;
  searchPlaceholder?: string;
};

type FilterState = {
  q: string;
  workgroup: string;
};

export function BookregisterListFilters({
  basePath,
  q: qProp,
  workgroupId: workgroupIdProp,
  workgroups,
  workgroupLabelId,
  showWorkgroup = true,
  searchPlaceholder = "ค้นหาเรื่อง เลขหนังสือ เลขทะเบียน จาก ถึง บุคคลปฏิบัติ…",
}: BookregisterListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(qProp);
  const [workgroup, setWorkgroup] = useState(
    workgroupIdProp != null ? String(workgroupIdProp) : "",
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<FilterState>({ q, workgroup });
  stateRef.current = { q, workgroup };

  useEffect(() => {
    setQ(qProp);
    setWorkgroup(workgroupIdProp != null ? String(workgroupIdProp) : "");
  }, [qProp, workgroupIdProp]);

  const parseWorkgroupId = (value: string) => {
    const id = value ? Number(value) : undefined;
    return id && Number.isFinite(id) ? id : undefined;
  };

  const commit = useCallback(
    (next: FilterState) => {
      if (!canCommitRegisterListQuery(next.q)) return;

      const workgroupId = parseWorkgroupId(next.workgroup);

      if (
        listSearchUrlMatches(basePath, pathname, searchParams, {
          q: next.q,
          workgroupId,
          page: 1,
        })
      ) {
        return;
      }

      const href = buildListSearchUrl(basePath, {
        q: next.q,
        workgroupId,
        page: 1,
      });

      startTransition(() => {
        router.replace(href);
      });
    },
    [basePath, pathname, router, searchParams],
  );

  const commitDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commit(stateRef.current);
    }, DEBOUNCE_MS);
  }, [commit]);

  const commitImmediate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commit(stateRef.current);
  }, [commit]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const hasActiveFilters = Boolean(qProp || workgroupIdProp);
  const showMinLengthHint =
    q.trim().length > 0 && q.trim().length < MIN_REGISTER_LIST_QUERY_LENGTH;

  const hintMessage = showMinLengthHint
    ? `พิมพ์อย่างน้อย ${MIN_REGISTER_LIST_QUERY_LENGTH} ตัวอักษรเพื่อค้นหา`
    : isPending
      ? "กำลังค้นหา…"
      : null;

  const workgroupSelectMinWidth = useMemo(
    () => `${longestWorkgroupLabelCh(workgroups)}ch`,
    [workgroups],
  );

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div
        className={cn(
          "flex flex-col gap-3 transition-opacity lg:flex-row lg:items-start lg:gap-4",
          isPending && "opacity-70",
        )}
        aria-busy={isPending}
      >
        <div className="w-full max-w-full lg:max-w-xs lg:shrink-0 xl:max-w-sm">
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="bookregister-list-q"
          >
            คำค้น
          </label>
          <input
            id="bookregister-list-q"
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => {
              const nextQ = e.target.value;
              setQ(nextQ);
              stateRef.current = { q: nextQ, workgroup };
              commitDebounced();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitImmediate();
              }
            }}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            aria-describedby="bookregister-list-q-hint"
          />
          <p
            id="bookregister-list-q-hint"
            className="mt-1 min-h-5 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {hintMessage ?? "\u00a0"}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-end lg:w-auto">
          {showWorkgroup ? (
            <label
              className="flex w-max max-w-full flex-col gap-1 text-sm"
              style={{ minWidth: workgroupSelectMinWidth }}
            >
              <span id={workgroupLabelId} className="font-medium">
                กลุ่มปฏิบัติ
              </span>
              <select
                value={workgroup}
                aria-labelledby={workgroupLabelId}
                onChange={(e) => {
                  const nextWorkgroup = e.target.value;
                  setWorkgroup(nextWorkgroup);
                  stateRef.current = { q, workgroup: nextWorkgroup };
                  commitImmediate();
                }}
                className="h-10 w-full min-w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">ทุกกลุ่ม(งาน)</option>
                {workgroups.map((wg) => (
                  <option key={wg.id} value={wg.id}>
                    {wg.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {hasActiveFilters ? (
            <Link
              href={basePath}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 shrink-0 whitespace-nowrap sm:self-end",
              )}
            >
              ล้างตัวกรอง
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
