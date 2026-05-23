"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Plus } from "lucide-react";

const TABS = [
  {
    href: "/",
    label: "Today",
    icon: Home,
  },
  {
    href: "/stats",
    label: "Stats",
    icon: BarChart3,
  },
  {
    href: "/habits",
    label: "Habits",
    icon: Plus,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="grid grid-cols-3 rounded-[30px] border border-white/10 bg-[#11170f]/88 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          const className = active
            ? "flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[#c6ff3d] text-sm font-black text-[#081006] shadow-[0_10px_28px_rgba(198,255,61,0.24)]"
            : "flex h-12 items-center justify-center gap-2 rounded-[22px] text-sm font-bold text-[#788274] transition active:scale-95";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
