"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

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
      <div className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
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
                : "rounded-[32px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-2xl"
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
                <Link
                  href={`/habits/${habit.id}`}
                  className="min-w-0 flex-1 transition active:scale-[0.99]"
                >
                  <h2 className="truncate text-[18px] font-black tracking-[-0.025em] text-white">
                    {habit.name}
                  </h2>

                  <div className="mt-1.5">
                    <ScheduleSummary habit={habit} today={today} />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setEditingId(habit.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#8c9686] transition hover:bg-white/10 hover:text-[#d8ff69] active:scale-95"
                  aria-label={`Edit ${habit.name}`}
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(habit.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#667061] transition hover:bg-white/10 hover:text-[#ff6b6b] active:scale-95"
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
