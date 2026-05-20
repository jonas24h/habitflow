"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Home, Plus } from "lucide-react";
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
    <main className="min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />
        <section className="relative flex min-h-dvh flex-col px-5 pb-28 pt-5">
          <header className="-mx-5 px-5 pb-5 pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686] transition active:scale-[0.99]"
                >
                  <ArrowLeft size={15} />
                  Today
                </Link>
                <h1 className="mt-3 text-[40px] font-black leading-none tracking-[-0.05em]">
                  Habits
                </h1>
              </div>

              <div className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] px-3 text-[13px] font-black text-[#d8ff69] shadow-[0_10px_30px_rgba(190,255,79,0.12)] backdrop-blur-xl">
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
              <h2 className="text-[24px] font-black tracking-[-0.035em] text-white">
                All habits
              </h2>
              <p className="text-sm font-semibold text-[#8c9686]">
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

          <nav className="fixed bottom-4 left-1/2 z-30 grid w-[calc(100%-40px)] max-w-[390px] -translate-x-1/2 grid-cols-3 rounded-[30px] border border-white/10 bg-[#11170f]/85 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <Link
              href="/"
              className="flex h-12 items-center justify-center gap-2 rounded-[22px] text-sm font-bold text-[#788274] transition active:scale-95"
            >
              <Home size={18} />
              Home
            </Link>
            <div className="flex h-12 items-center justify-center gap-2 rounded-[22px] text-sm font-bold text-[#788274]">
              <BarChart3 size={18} />
              Stats
            </div>
            <div className="flex h-12 items-center justify-center gap-2 rounded-[22px] bg-[#c6ff3d] text-sm font-black text-[#081006] shadow-[0_10px_28px_rgba(198,255,61,0.24)]">
              <Plus size={18} />
              Habits
            </div>
          </nav>
        </section>
      </div>
    </main>
  );
}
