"use client";

import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog } from "radix-ui";

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
    <Dialog.Root open={Boolean(habit)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[999] bg-black/55 backdrop-blur-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content className="fixed inset-0 z-[1000] flex items-center justify-center px-5 py-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-[#f4f7f1] outline-none">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: QUICK_EASE }}
            className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2.5rem)] w-full max-w-[390px] overflow-y-auto rounded-[34px] border border-white/10 bg-[#0b0f0a]/98 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.64),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 text-[#ff9a9a]">
              <Trash2 size={21} />
            </div>
            <Dialog.Title className="mt-4 text-[24px] font-black tracking-[-0.035em] text-white">
              Delete habit?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-[15px] font-semibold leading-6 text-[#8c9686]">
              This will delete {habit ? `"${habit.name}"` : "this habit"} and
              its check-in history.
            </Dialog.Description>

            <div className="mt-6 grid grid-cols-2 gap-3">
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
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
