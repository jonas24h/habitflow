"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { HabitForm } from "@/components/habits/habit-form";
import { ScheduleSummary } from "@/components/habits/schedule-summary";
import type { Habit, HabitSchedule } from "@/types/habit";

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
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (habits.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-black/10 bg-white/90 p-8 text-center shadow-[0_14px_36px_rgba(26,31,44,0.05)]">
        <p className="text-lg font-semibold tracking-[-0.015em]">
          No habits yet
        </p>
        <p className="mt-2 text-sm font-medium text-[#858b96]">
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
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              delay: index * 0.02,
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={
              editingId === habit.id
                ? ""
                : "rounded-[30px] bg-white/90 p-4 shadow-[0_14px_36px_rgba(26,31,44,0.06)] ring-1 ring-black/[0.035]"
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
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-semibold tracking-[-0.012em] text-[#1d1d1f]">
                    {habit.name}
                  </h2>

                  <div className="mt-1.5">
                    <ScheduleSummary habit={habit} today={today} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingId(habit.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#858b96] transition hover:bg-[#f2f3f5] active:scale-95"
                  aria-label={`Edit ${habit.name}`}
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(habit.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#c1c7d0] transition hover:bg-[#fff1f1] hover:text-[#ff3b30] active:scale-95"
                  aria-label={`Delete ${habit.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
