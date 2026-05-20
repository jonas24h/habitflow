"use client";

import { HabitCard } from "@/components/habits/habit-card";
import {
  dateKey,
  fromDateKey,
  getDueHabitsForDate,
  HABIT_STORAGE_KEY,
  isHabitDueOnDate,
  normalizeHabitSchedule,
  STARTER_HABITS,
} from "@/lib/habits";
import type { Habit, HabitSchedule } from "@/types/habit";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "short",
});
const WEEKDAY_PLACEHOLDERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getLastSevenDays(today: string) {
  if (!today) {
    return WEEKDAY_PLACEHOLDERS.map((label, index) => ({
      key: `placeholder-${label}-${index}`,
      dateKey: "",
      label,
      isToday: false,
    }));
  }

  const date = fromDateKey(today);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setDate(date.getDate() - (6 - index));

    const key = dateKey(day);

    return {
      key,
      dateKey: key,
      label: WEEKDAY_FORMATTER.format(day),
      isToday: key === today,
    };
  });
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

function getHabitsForDateOverview(habits: Habit[], key: string) {
  if (!key) return [];

  const dueHabits = getDueHabitsForDate(habits, key);
  const habitsById = new Map(dueHabits.map((habit) => [habit.id, habit]));

  habits.forEach((habit) => {
    if (!habit.completedDates.includes(key)) return;

    const wasDueBeforeCompletion = isHabitDueOnDate(
      {
        ...habit,
        completedDates: habit.completedDates.filter((date) => date !== key),
      },
      key
    );

    if (wasDueBeforeCompletion) {
      habitsById.set(habit.id, habit);
    }
  });

  return Array.from(habitsById.values());
}

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>(STARTER_HABITS);
  const [today, setToday] = useState("");
  const [formattedDate, setFormattedDate] = useState("Today");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const currentDate = new Date();

      setToday(dateKey(currentDate));
      setFormattedDate(DATE_FORMATTER.format(currentDate));
      setHabits(readStoredHabits());
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  }, [habits, hasHydrated]);

  const activeToday = today || dateKey();
  const dueHabitsToday = getDueHabitsForDate(habits, activeToday);
  const habitsForTodayOverview = getHabitsForDateOverview(habits, activeToday);
  const completedHabits = habitsForTodayOverview.filter((habit) =>
    habit.completedDates.includes(activeToday)
  );
  const todoHabitsToday = dueHabitsToday.filter(
    (habit) => !habit.completedDates.includes(activeToday)
  );
  const completedToday = completedHabits.length;
  const remainingToday = todoHabitsToday.length;
  const dueTodayCount = habitsForTodayOverview.length;
  const progressPercent =
    dueTodayCount === 0
      ? 0
      : Math.round((completedToday / dueTodayCount) * 100);
  const weekDays = getLastSevenDays(activeToday);
  function toggleHabit(id: string, day = activeToday) {
    if (!day) return;

    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;

        const completed = habit.completedDates.includes(day);

        return {
          ...habit,
          completedDates: completed
            ? habit.completedDates.filter((date) => date !== day)
            : [...habit.completedDates, day].sort(),
        };
      })
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
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#858b96]">
                  <CalendarDays size={15} />
                  {formattedDate}
                </p>
                <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.025em]">
                  Today
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] bg-white/90 px-3 text-[13px] font-semibold text-[#1d1d1f] shadow-[0_10px_28px_rgba(26,31,44,0.08)] ring-1 ring-black/[0.035]"
                >
                  {progressPercent}%
                </motion.div>

                <Link
                  href="/habits"
                  className="pointer-events-auto flex h-[52px] w-[52px] shrink-0 touch-manipulation items-center justify-center rounded-[22px] bg-[#007aff] text-white shadow-[0_10px_24px_rgba(0,122,255,0.22)] transition active:scale-95"
                  aria-label="Manage habits"
                >
                  <Plus size={21} />
                </Link>
              </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="w-full shrink-0 rounded-[30px] bg-white/90 p-4 shadow-[0_14px_36px_rgba(26,31,44,0.06)] ring-1 ring-black/[0.035]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#858b96]">
                  Last 7 days
                </p>
                <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.018em]">
                  Weekly overview
                </h2>
              </div>
              <p className="rounded-full bg-[#f2f3f5] px-3 py-1.5 text-[13px] font-semibold text-[#656b75]">
                {progressPercent}%
              </p>
            </div>

            <div className="mt-4 grid w-full min-w-0 grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dueForDay = day.dateKey
                  ? getHabitsForDateOverview(habits, day.dateKey)
                  : [];
                const completedForDay = dueForDay.filter((habit) =>
                  habit.completedDates.includes(day.dateKey)
                ).length;
                const dayPercent =
                  dueForDay.length === 0
                    ? 0
                    : Math.round((completedForDay / dueForDay.length) * 100);

                return (
                  <div
                    key={day.key}
                    className={`flex min-w-0 flex-col items-center rounded-[20px] px-1.5 py-2.5 transition ${
                      day.isToday ? "bg-[#f2f8ff]" : "bg-transparent"
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold ${
                        day.isToday ? "text-[#007aff]" : "text-[#858b96]"
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </p>

                    <div className="mt-2 flex h-16 w-5 items-end overflow-hidden rounded-full bg-[#edf0f3]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${dayPercent}%` }}
                        transition={{
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`w-full rounded-full ${
                          day.isToday ? "bg-[#007aff]" : "bg-[#34c759]"
                        }`}
                      />
                    </div>

                    <p
                      className={`mt-2 text-[11px] font-semibold ${
                        day.isToday ? "text-[#007aff]" : "text-[#656b75]"
                      }`}
                    >
                      {dayPercent}%
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <section className="mt-7 flex flex-1 flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                To do today
              </h2>
              <p className="text-sm font-medium text-[#858b96]">
                {remainingToday} left
              </p>
            </div>

            <AnimatePresence initial={false}>
              {todoHabitsToday.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  today={activeToday}
                  onToggle={toggleHabit}
                  onDelete={deleteHabit}
                />
              ))}

              {habits.length > 0 && todoHabitsToday.length === 0 && (
                <motion.div
                  key="today-complete"
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[30px] bg-white/90 p-6 text-center shadow-[0_14px_36px_rgba(26,31,44,0.055)] ring-1 ring-black/[0.035]"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#edf7f1] text-[#34c759]">
                    <CheckCircle2 size={22} />
                  </div>
                  <p className="mt-4 text-lg font-semibold tracking-[-0.015em]">
                    {dueTodayCount === 0
                      ? "Nothing is due today"
                      : "You are done for today"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#858b96]">
                    {dueTodayCount === 0
                      ? "Scheduled habits will appear when they are due."
                      : "All due habits are checked off."}
                  </p>
                </motion.div>
              )}

              {habits.length === 0 && (
                <motion.div
                  key="empty-habits"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[30px] border border-dashed border-black/10 bg-white/90 p-8 text-center shadow-[0_14px_36px_rgba(26,31,44,0.05)]"
                >
                  <p className="text-lg font-semibold tracking-[-0.015em]">
                    No habits yet
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#858b96]">
                    Add your first habit and start building momentum today.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {completedHabits.length > 0 && (
                <motion.div
                  key="done-section"
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
                      Done today
                    </h2>
                    <p className="text-sm font-medium text-[#858b96]">
                      {completedHabits.length} complete
                    </p>
                  </div>

                  <AnimatePresence initial={false}>
                    {completedHabits.map((habit, index) => (
                      <HabitCard
                        key={habit.id}
                       habit={habit}
                        index={index}
                        today={activeToday}
                        onToggle={toggleHabit}
                        onDelete={deleteHabit}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </section>
      </div>
    </main>
  );
}
