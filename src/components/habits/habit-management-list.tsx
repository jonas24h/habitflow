"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { HabitForm } from "@/components/habits/habit-form";
import { ScheduleSummary } from "@/components/habits/schedule-summary";
import type { Habit, HabitSchedule } from "@/types/habit";

const QUICK_EASE = [0.2, 0.8, 0.2, 1] as const;
const MotionLink = motion.create(Link);

export function HabitManagementList({
  habits,
  today,
  onUpdate,
  onDelete,
}: {
  habits: Habit[];
  today: string;
  onUpdate: (
    id: string,
    values: { name: string; schedule: HabitSchedule }
  ) => void;
  onDelete: (habit: Habit) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (habits.length === 0) {
    return (
      <div className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-md">
        <p className="text-lg font-bold tracking-[-0.02em] text-white">
          No habits yet
        </p>
        <p className="mt-2 text-sm font-medium text-[#8c9686]">
          Create your first scheduled habit above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <AnimatePresence initial={false}>
        {habits.map((habit, index) => (
          <motion.article
            key={habit.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.985 }}
            transition={{
              delay: Math.min(index * 0.015, 0.06),
              layout: { duration: 0.22, ease: QUICK_EASE },
              duration: 0.18,
              ease: QUICK_EASE,
            }}
            style={{ willChange: "transform, opacity" }}
            className={
              editingId === habit.id
                ? ""
                : "rounded-[32px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur-md transform-gpu"
            }
          >
            {editingId === habit.id ? (
              <HabitForm
                habit={habit}
                submitLabel="Save habit"
                onSubmit={(values) => {
                  onUpdate(habit.id, values);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3.5">
                <MotionLink
                  href={`/habits/${habit.id}`}
                  className="min-w-0 flex-1 touch-manipulation transition-transform duration-150"
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.12, ease: QUICK_EASE }}
                >
                  <h2 className="truncate text-[18px] font-black tracking-[-0.025em] text-white">
                    {habit.name}
                  </h2>

                  <div className="mt-1.5">
                    <ScheduleSummary habit={habit} today={today} />
                  </div>
                </MotionLink>

                <motion.button
                  type="button"
                  onClick={() => setEditingId(habit.id)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.12, ease: QUICK_EASE }}
                  className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-white/[0.08] text-[#8c9686] transition-colors duration-150 hover:bg-white/10 hover:text-[#d8ff69] transform-gpu"
                  aria-label={`Edit ${habit.name}`}
                >
                  <Pencil size={18} />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => onDelete(habit)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.12, ease: QUICK_EASE }}
                  className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-white/[0.08] text-[#667061] transition-colors duration-150 hover:bg-white/10 hover:text-[#ff6b6b] transform-gpu"
                  aria-label={`Delete ${habit.name}`}
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>
            )}
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
