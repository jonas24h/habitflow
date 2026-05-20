"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import { HabitForm } from "@/components/habits/habit-form";
import { HabitManagementList } from "@/components/habits/habit-management-list";
import {
  dateKey,
  HABIT_STORAGE_KEY,
  normalizeHabitSchedule,
  STARTER_HABITS,
} from "@/lib/habits";
import type { Habit, HabitSchedule } from "@/types/habit";

function createHabit(name: string, schedule: HabitSchedule): Habit {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    createdAt: new Date().toISOString(),
    completedDates: [],
    schedule,
  };
}

function readStoredHabits() {
  try {
    if (typeof window === "undefined") return STARTER_HABITS;

    const stored = localStorage.getItem(HABIT_STORAGE_KEY);
    if (!stored) return STARTER_HABITS;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return STARTER_HABITS;

    return parsed
      .filter(
        (habit): habit is Omit<Habit, "schedule"> & {
          schedule?: HabitSchedule;
        } =>
          typeof habit?.id === "string" &&
          typeof habit?.name === "string" &&
          typeof habit?.createdAt === "string" &&
          Array.isArray(habit?.completedDates)
      )
      .map((habit) => ({
        ...habit,
        schedule: normalizeHabitSchedule(habit.schedule),
      }));
  } catch {
    return STARTER_HABITS;
  }
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(STARTER_HABITS);
  const [today, setToday] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      setToday(dateKey());
      setHabits(readStoredHabits());
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  }, [habits, hasHydrated]);

  function addHabit(values: { name: string; schedule: HabitSchedule }) {
    setHabits((current) => [
      createHabit(values.name, values.schedule),
      ...current,
    ]);
  }

  function updateHabit(
    id: string,
    values: { name: string; schedule: HabitSchedule }
  ) {
    setHabits((current) =>
      current.map((habit) =>
        habit.id === id
          ? { ...habit, name: values.name, schedule: values.schedule }
          : habit
      )
    );
  }

  function deleteHabit(id: string) {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }

  return (
    <main className="min-h-dvh bg-[#f0f2f5] font-sans text-[#1d1d1f]">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-[#f7f8fa] shadow-[0_24px_80px_rgba(26,31,44,0.12)]">
        <section className="flex min-h-dvh flex-col px-5 pb-8 pt-5">
          <header className="-mx-5 bg-[#f7f8fa] px-5 pb-5 pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#858b96] transition active:scale-[0.99]"
                >
                  <ArrowLeft size={15} />
                  Today
                </Link>
                <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.025em]">
                  Habits
                </h1>
              </div>

              <div className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] bg-white/90 px-3 text-[13px] font-semibold text-[#1d1d1f] shadow-[0_10px_28px_rgba(26,31,44,0.08)] ring-1 ring-black/[0.035]">
                {habits.length}
              </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="w-full shrink-0"
          >
            <HabitForm submitLabel="Create habit" onSubmit={addHabit} />
          </motion.section>

          <section className="mt-7 flex flex-1 flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                All habits
              </h2>
              <p className="text-sm font-medium text-[#858b96]">
                {habits.length} active
              </p>
            </div>

            <HabitManagementList
              habits={habits}
              today={today}
              onUpdate={updateHabit}
              onDelete={deleteHabit}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
