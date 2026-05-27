"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const QUICK_EASE = [0.2, 0.8, 0.2, 1] as const;

type HabitActionMenuProps = {
  habitName: string;
  onAnalyze: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const ACTIONS = [
  {
    label: "Analyze",
    icon: BarChart3,
    tone: "text-[#d8ff69]",
    action: "analyze",
  },
  {
    label: "Edit",
    icon: Pencil,
    tone: "text-[#c4ccb9]",
    action: "edit",
  },
  {
    label: "Delete",
    icon: Trash2,
    tone: "text-[#ff9a9a]",
    action: "delete",
  },
] as const;

export function HabitActionMenu({
  habitName,
  onAnalyze,
  onEdit,
  onDelete,
}: HabitActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideTap(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideTap, true);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideTap, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function runAction(action: (typeof ACTIONS)[number]["action"]) {
    setIsOpen(false);

    if (action === "analyze") {
      onAnalyze();
      return;
    }

    if (action === "edit") {
      onEdit();
      return;
    }

    onDelete();
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.12, ease: QUICK_EASE }}
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/[0.08] text-[#8c9686] transition-colors duration-150 hover:bg-white/10 hover:text-[#d8ff69] transform-gpu"
        aria-label={`Open actions for ${habitName}`}
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: QUICK_EASE }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-40 overflow-hidden rounded-[22px] border border-white/10 bg-[#10160f]/98 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          >
            {ACTIONS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => runAction(item.action)}
                  className="flex h-11 w-full touch-manipulation items-center gap-2.5 rounded-[17px] px-3 text-left text-[14px] font-black text-[#f4f7f1] transition-colors duration-150 hover:bg-white/[0.08] active:bg-white/[0.10]"
                >
                  <Icon size={17} className={item.tone} />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
