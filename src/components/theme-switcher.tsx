"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeId = "light" | "dark";

const OPTIONS: {
  id: ThemeId;
  label: string;
  emoji: string;
}[] = [
  { id: "light", label: "โหมดราชการ", emoji: "☀️" },
  { id: "dark", label: "โหมดมืด", emoji: "🌙" },
];

const trackClass =
  "relative inline-flex h-8 w-[4.25rem] shrink-0 rounded-full border bg-card p-0.5 shadow-sm";

const thumbClass =
  "pointer-events-none absolute top-0.5 flex size-7 items-center justify-center rounded-full bg-muted shadow-sm transition-[left] duration-200 ease-out motion-reduce:transition-none";

const emojiClass = "select-none text-base leading-none";

const zoneClass =
  "relative z-10 flex flex-1 cursor-pointer items-center justify-center rounded-full outline-none transition-opacity hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50";

function ThemeSwitcherSkeleton() {
  return (
    <div
      className={trackClass}
      role="group"
      aria-label="เลือกโหมดสี"
      aria-busy="true"
    >
      <span className={cn(thumbClass, "left-0.5")} aria-hidden>
        <span className={emojiClass}>☀️</span>
      </span>
      <span className="flex flex-1 items-center justify-center opacity-50">
        <span className={emojiClass}>☀️</span>
      </span>
      <span className="flex flex-1 items-center justify-center opacity-50">
        <span className={emojiClass}>🌙</span>
      </span>
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect -- hydration guard for next-themes

  useEffect(() => {
    if (theme === "sepia") setTheme("light");
  }, [theme, setTheme]);

  if (!mounted) {
    return <ThemeSwitcherSkeleton />;
  }

  const activeTheme: ThemeId = theme === "dark" ? "dark" : "light";
  const activeEmoji =
    OPTIONS.find((o) => o.id === activeTheme)?.emoji ?? "☀️";

  return (
    <div className={trackClass} role="group" aria-label="เลือกโหมดสี">
      <span
        aria-hidden
        className={cn(
          thumbClass,
          activeTheme === "dark"
            ? "left-[calc(100%-2rem)]"
            : "left-0.5",
        )}
      >
        <span className={emojiClass}>{activeEmoji}</span>
      </span>

      {OPTIONS.map(({ id, label, emoji }) => {
        const selected = activeTheme === id;
        return (
          <button
            key={id}
            type="button"
            className={cn(zoneClass, selected ? "opacity-0" : "opacity-80")}
            aria-label={label}
            title={label}
            aria-pressed={selected}
            onClick={() => setTheme(id)}
          >
            <span className={emojiClass} aria-hidden>
              {emoji}
            </span>
          </button>
        );
      })}
    </div>
  );
}
