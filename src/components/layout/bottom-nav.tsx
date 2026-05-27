"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, UserRound } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  {
    href: "/",
    label: "Today",
    icon: Home,
  },
  {
    href: "/habits",
    label: "Habits",
    icon: Plus,
  },
  {
    href: "/account",
    label: "Account",
    icon: UserRound,
  },
];

const MotionLink = motion.create(Link);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="grid grid-cols-3 rounded-[30px] border border-white/10 bg-[#11170f]/92 p-2 shadow-[0_12px_34px_rgba(0,0,0,0.38)] backdrop-blur-md transform-gpu">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const className = active
            ? "flex h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[22px] bg-[#c6ff3d] text-[11px] font-black leading-none text-[#081006] shadow-[0_8px_18px_rgba(198,255,61,0.20)] transform-gpu"
            : "flex h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold leading-none text-[#788274] transition-colors duration-150 transform-gpu";

          return (
            <MotionLink
              key={tab.href}
              href={tab.href}
              className={className}
              aria-current={active ? "page" : undefined}
              whileTap={{ scale: 0.93 }}
              transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Icon size={18} />
              {tab.label}
            </MotionLink>
          );
        })}
      </div>
    </nav>
  );
}
