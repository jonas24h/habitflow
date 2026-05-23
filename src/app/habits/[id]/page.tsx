"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Pencil,
  Trash2,
  Trophy,
} from "lucide-react";

import { HabitForm } from "@/components/habits/habit-form";
import { ScheduleSummary, getScheduleSummary } from "@/components/habits/schedule-summary";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboarding } from "@/components/onboarding/profile-onboarding";
import { dateKey, fromDateKey, isHabitDueOnDate } from "@/lib/habits";
import {
  deleteHabit as deleteHabitFromSupabase,
  fetchHabits,
  updateHabit as updateHabitInSupabase,
} from "@/lib/habit-service";
import { fetchProfile } from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitSchedule } from "@/types/habit";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type DayOverview = {
  key: string;
  completed: number;
  total: number;
  percent: number;
};

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDateKeys(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    dateKey(new Date(year, monthIndex, index + 1))
  );
}

function isHabitDueForAnalytics(habit: Habit, key: string) {
  const completedBeforeOrOnDate = habit.completedDates.filter(
    (completedDate) => completedDate <= key
  );
  const completedBeforeDate = completedBeforeOrOnDate.filter(
    (completedDate) => completedDate !== key
  );

  if (completedBeforeOrOnDate.includes(key)) {
    return isHabitDueOnDate(
      {
        ...habit,
        completedDates: completedBeforeDate,
      },
      key
    );
  }

  return isHabitDueOnDate(
    {
      ...habit,
      completedDates: completedBeforeOrOnDate,
    },
    key
  );
}

function getDayOverview(habit: Habit, key: string): DayOverview {
  const due = isHabitDueForAnalytics(habit, key);
  const completed = due && habit.completedDates.includes(key) ? 1 : 0;

  return {
    key,
    completed,
    total: due ? 1 : 0,
    percent: due ? completed * 100 : 0,
  };
}

function getMonthlyHeatmap(habit: Habit, month: Date) {
  const firstWeekday = (getMonthStart(month).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstWeekday }, () => null);
  const days = getMonthDateKeys(month).map((key) => getDayOverview(habit, key));

  return {
    label: MONTH_FORMATTER.format(month),
    cells: [...blanks, ...days],
  };
}

function getMonthlyCompletion(habit: Habit, month: Date) {
  const days = getMonthDateKeys(month).map((key) => getDayOverview(habit, key));
  const due = days.reduce((sum, day) => sum + day.total, 0);
  const completed = days.reduce((sum, day) => sum + day.completed, 0);
  const percent = due === 0 ? 0 : Math.round((completed / due) * 100);

  return { completed, due, percent };
}

function getHabitCurrentStreak(habit: Habit, today: string) {
  let streak = 0;
  const date = fromDateKey(today);

  for (let index = 0; index < 730; index += 1) {
    const key = dateKey(date);
    const due = isHabitDueForAnalytics(habit, key);

    if (due && habit.completedDates.includes(key)) {
      streak += 1;
    } else if (due) {
      break;
    }

    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function getHabitBestStreak(habit: Habit, today: string) {
  const createdKey = dateKey(new Date(habit.createdAt));
  const start = fromDateKey(createdKey);
  const end = fromDateKey(today);
  let best = 0;
  let current = 0;

  for (
    const date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const key = dateKey(date);
    const due = isHabitDueForAnalytics(habit, key);

    if (!due) continue;

    if (habit.completedDates.includes(key)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

function heatClass(day: DayOverview) {
  if (day.total === 0) return "bg-white/[0.05]";
  if (day.percent === 100) return "bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.35)]";
  return "bg-white/[0.12]";
}

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const habitId = params.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userId, setUserId] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getMonthStart(new Date())
  );
  const today = dateKey();
  const currentMonth = getMonthStart(new Date());
  const isCurrentMonth =
    getMonthKey(selectedMonth) === getMonthKey(currentMonth);
  const habit = habits.find((currentHabit) => currentHabit.id === habitId);

  useEffect(() => {
    let cancelled = false;

    async function loadHabits(nextUserId: string) {
      try {
        const nextHabits = await fetchHabits(nextUserId);

        if (cancelled) return;

        setHabits(nextHabits);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setErrorMessage("Could not load habit from Supabase.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        router.replace("/auth");
        return;
      }

      setUserId(session.user.id);

      try {
        const profile = await fetchProfile(session.user.id);

        if (cancelled) return;

        setNeedsOnboarding(!profile);
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setErrorMessage("Could not load profile from Supabase.");
      }

      loadHabits(session.user.id);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/auth");
      }
    });

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  const analytics = useMemo(() => {
    if (!habit) return null;

    return {
      currentStreak: getHabitCurrentStreak(habit, today),
      bestStreak: getHabitBestStreak(habit, today),
      heatmap: getMonthlyHeatmap(habit, selectedMonth),
      completion: getMonthlyCompletion(habit, selectedMonth),
    };
  }, [habit, selectedMonth, today]);

  function completeOnboarding() {
    setNeedsOnboarding(false);
    setErrorMessage("");
  }

  function showPreviousMonth() {
    setSelectedMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
    );
  }

  function showNextMonth() {
    setSelectedMonth((month) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

      return nextMonth > currentMonth ? month : nextMonth;
    });
  }

  async function updateHabit(values: { name: string; schedule: HabitSchedule }) {
    if (!userId || !habit) return;

    try {
      const updatedHabit = await updateHabitInSupabase(userId, habit.id, values);

      setHabits((current) =>
        current.map((currentHabit) =>
          currentHabit.id === habit.id
            ? { ...updatedHabit, completedDates: currentHabit.completedDates }
            : currentHabit
        )
      );
      setIsEditing(false);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update habit.");
    }
  }

  async function deleteHabit() {
    if (!userId || !habit) return;

    try {
      await deleteHabitFromSupabase(userId, habit.id);
      router.replace("/habits");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not delete habit.");
    }
  }

  return (
    <main className="min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      {needsOnboarding && userId && (
        <ProfileOnboarding userId={userId} onComplete={completeOnboarding} />
      )}
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />
        <section className="relative flex min-h-dvh flex-col px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
          <header className="-mx-5 px-5 pb-5 pt-3">
            <Link
              href="/habits"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686] transition active:scale-[0.99]"
            >
              <ArrowLeft size={15} />
              Habits
            </Link>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686]">
                  <CalendarDays size={15} />
                  Habit detail
                </p>
                <h1 className="mt-2 truncate text-[42px] font-black leading-none tracking-[-0.06em] text-white">
                  {habit?.name ?? "Habit"}
                </h1>
                {habit && (
                  <p className="mt-3 text-[15px] font-semibold text-[#8c9686]">
                    {getScheduleSummary(habit.schedule)}
                  </p>
                )}
              </div>
            </div>
          </header>

          {errorMessage && (
            <div className="mb-4 rounded-[26px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
              {errorMessage}
            </div>
          )}

          {isLoading && (
            <div className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <p className="text-sm font-semibold text-[#8c9686]">
                Loading habit...
              </p>
            </div>
          )}

          {!isLoading && !habit && (
            <div className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <p className="text-lg font-bold tracking-[-0.02em] text-white">
                Habit not found
              </p>
              <p className="mt-2 text-sm font-medium text-[#8c9686]">
                It may have been deleted or belongs to another account.
              </p>
            </div>
          )}

          {!isLoading && habit && analytics && (
            <>
              {isEditing ? (
                <HabitForm
                  habit={habit}
                  submitLabel="Save habit"
                  onSubmit={updateHabit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <section className="rounded-[34px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                    <ScheduleSummary habit={habit} today={today} />
                  </section>

                  <section className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Current streak",
                        value: analytics.currentStreak,
                        icon: Flame,
                      },
                      {
                        label: "Best streak",
                        value: analytics.bestStreak,
                        icon: Trophy,
                      },
                    ].map((card, index) => {
                      const Icon = card.icon;

                      return (
                        <motion.div
                          key={card.label}
                          initial={{ opacity: 0, y: 14, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: index * 0.04,
                            duration: 0.32,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="rounded-[30px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#c6ff3d]/15 text-[#d8ff69] ring-1 ring-[#c6ff3d]/20">
                            <Icon size={20} />
                          </div>
                          <p className="mt-5 text-[44px] font-black leading-none tracking-[-0.06em] text-white">
                            {card.value}
                            <span className="text-[20px] text-[#c6ff3d]">d</span>
                          </p>
                          <p className="mt-2 text-[13px] font-semibold text-[#8c9686]">
                            {card.label}
                          </p>
                        </motion.div>
                      );
                    })}
                  </section>

                  <section className="mt-4 rounded-[34px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={showPreviousMonth}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 text-[#c4ccb9] transition active:scale-95"
                        aria-label="Show previous month"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="min-w-0 text-center">
                        <p className="text-[13px] font-semibold text-[#8c9686]">
                          Monthly heatmap
                        </p>
                        <h2 className="mt-1 truncate text-[22px] font-black tracking-[-0.035em] text-white">
                          {analytics.heatmap.label}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={showNextMonth}
                        disabled={isCurrentMonth}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-black/20 text-[#c4ccb9] transition active:scale-95 disabled:opacity-35"
                        aria-label="Show next month"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-7 gap-2">
                      {WEEKDAY_LABELS.map((label, index) => (
                        <p
                          key={`${label}-${index}`}
                          className="text-center text-[11px] font-bold text-[#6f7a68]"
                        >
                          {label}
                        </p>
                      ))}
                      {analytics.heatmap.cells.map((cell, index) =>
                        cell ? (
                          <div
                            key={cell.key}
                            className={`aspect-square rounded-[10px] ${heatClass(cell)}`}
                            title={`${cell.key}: ${cell.completed}/${cell.total}`}
                          />
                        ) : (
                          <div key={`blank-${index}`} className="aspect-square" />
                        )
                      )}
                    </div>
                  </section>

                  <section className="mt-4 rounded-[34px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] font-semibold text-[#8c9686]">
                          Completion rate
                        </p>
                        <p className="mt-2 text-[44px] font-black leading-none tracking-[-0.06em] text-white">
                          {analytics.completion.percent}
                          <span className="text-[20px] text-[#c6ff3d]">%</span>
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#8c9686]">
                          {analytics.completion.completed} of{" "}
                          {analytics.completion.due} due this month
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.10]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analytics.completion.percent}%` }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-[#c6ff3d] shadow-[0_0_16px_rgba(198,255,61,0.40)]"
                      />
                    </div>
                  </section>

                  <section className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex h-14 items-center justify-center gap-2 rounded-[23px] border border-white/10 bg-white/[0.08] text-[15px] font-black text-[#d8ff69] transition active:scale-95"
                    >
                      <Pencil size={18} />
                      Edit habit
                    </button>
                    <button
                      type="button"
                      onClick={deleteHabit}
                      className="flex h-14 items-center justify-center gap-2 rounded-[23px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 text-[15px] font-black text-[#ffb3b3] transition active:scale-95"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </section>
                </>
              )}
            </>
          )}

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
