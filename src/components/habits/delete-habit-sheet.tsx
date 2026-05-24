"use client";

import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Habit } from "@/types/habit";

const QUICK_EASE = [0.2, 0.8, 0.2, 1] as const;

export function DeleteHabitSheet({
  habit,
  isDeleting = false,
  onOpenChange,
  onConfirm,
}: {
  habit: Pick<Habit, "id" | "name"> | null;
  isDeleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={Boolean(habit)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="left-1/2 max-h-[88dvh] w-full max-w-[430px] -translate-x-1/2 rounded-t-[34px] border-white/10 bg-[#0b0f0a] px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 text-[#f4f7f1] shadow-[0_-24px_70px_rgba(0,0,0,0.58)]"
      >
        <SheetHeader className="p-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 text-[#ff9a9a]">
            <Trash2 size={21} />
          </div>
          <SheetTitle className="mt-4 text-[24px] font-black tracking-[-0.035em] text-white">
            Delete habit?
          </SheetTitle>
          <SheetDescription className="mt-2 text-[15px] font-semibold leading-6 text-[#8c9686]">
            This will delete {habit ? `"${habit.name}"` : "this habit"} and its
            check-in history.
          </SheetDescription>
        </SheetHeader>

        <SheetFooter className="mt-4 grid grid-cols-2 gap-3 p-0">
          <motion.button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12, ease: QUICK_EASE }}
            className="flex h-14 touch-manipulation items-center justify-center rounded-[23px] border border-white/10 bg-white/[0.07] text-[15px] font-black text-[#d8ff69] transition disabled:opacity-60"
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12, ease: QUICK_EASE }}
            className="flex h-14 touch-manipulation items-center justify-center rounded-[23px] border border-[#ff6b6b]/25 bg-[#ff3b30] text-[15px] font-black text-white shadow-[0_14px_34px_rgba(255,59,48,0.24)] transition disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete habit"}
          </motion.button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
