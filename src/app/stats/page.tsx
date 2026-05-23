"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboarding } from "@/components/onboarding/profile-onboarding";
import {
  dateKey,
  fromDateKey,
  getDueHabitsForDate,
  isHabitDueOnDate,
} from "@/lib/habits";
import { fetchHabits } from "@/lib/habit-service";
import { fetchProfile } from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";
import type { Habit } from "@/types/habit";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "short",
});
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_PLACEHOLDERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type DayOverview = {
  key: string;
  completed: number;
  total: number;
  percent: number;
};

type HabitInsight = {
  id: string;
  name: string;
  completed: number;
  due: number;
  percent: number;
  status: "Strong" | "Steady" | "Needs attention";
};

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

function getDayOverview(habits: Habit[], key: string): DayOverview {
  const dueHabits = habits.filter((habit) => isHabitDueForAnalytics(habit, key));
  const completed = dueHabits.filter((habit) =>
    habit.completedDates.includes(key)
  ).length;
  const percent =
    dueHabits.length === 0 ? 0 : Math.round((completed / dueHabits.length) * 100);

  return {
    key,
    completed,
    total: dueHabits.length,
    percent,
  };
}

function getMonthlyHeatmap(habits: Habit[], month: Date) {
  const firstWeekday = (getMonthStart(month).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstWeekday }, () => null);
  const days = getMonthDateKeys(month).map((key) => getDayOverview(habits, key));

  return {
    label: MONTH_FORMATTER.format(month),
    cells: [...blanks, ...days],
  };
}

function getHabitStatus(percent: number): HabitInsight["status"] {
  if (percent >= 80) return "Strong";
  if (percent >= 50) return "Steady";
  return "Needs attention";
}

function getHabitInsights(habits: Habit[], month: Date) {
  const monthKeys = getMonthDateKeys(month);

  return habits
    .map((habit): HabitInsight => {
      const dueKeys = monthKeys.filter((key) =>
        isHabitDueForAnalytics(habit, key)
      );
      const completed = dueKeys.filter((key) =>
        habit.completedDates.includes(key)
      ).length;
      const percent =
        dueKeys.length === 0 ? 0 : Math.round((completed / dueKeys.length) * 100);

      return {
        id: habit.id,
        name: habit.name,
        completed,
        due: dueKeys.length,
        percent,
        status: getHabitStatus(percent),
      };
    })
    .sort((a, b) => a.percent - b.percent || b.due - a.due);
}

function heatClass(day: DayOverview) {
  if (day.total === 0) return "bg-white/[0.05]";
  if (day.percent >= 90) return "bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.35)]";
  if (day.percent >= 60) return "bg-[#9bd737]";
  if (day.percent >= 30) return "bg-[#58752b]";
  if (day.percent > 0) return "bg-[#26351b]";
  return "bg-white/[0.10]";
}

function statusClass(status: HabitInsight["status"]) {
  switch (status) {
    case "Strong":
      return "bg-[#c6ff3d]/15 text-[#d8ff69] ring-[#c6ff3d]/20";
    case "Steady":
      return "bg-white/[0.08] text-[#c4ccb9] ring-white/10";
    case "Needs attention":
      return "bg-[#ffb86b]/12 text-[#ffd3a1] ring-[#ffb86b]/20";
  }
}

export default function StatsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userId, setUserId] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getMonthStart(new Date())
  );
  const today = dateKey();
  const currentMonth = getMonthStart(new Date());
  const isCurrentMonth =
    getMonthKey(selectedMonth) === getMonthKey(currentMonth);

  useEffect(() => {
    let cancelled = false;

    async function loadStats(nextUserId: string) {
      try {
        const nextHabits = await fetchHabits(nextUserId);

        if (cancelled) return;

        setHabits(nextHabits);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setErrorMessage("Could not load stats from Supabase.");
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

      loadStats(session.user.id);
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

  const stats = useMemo(() => {
    return {
      heatmap: getMonthlyHeatmap(habits, selectedMonth),
      habitInsights: getHabitInsights(habits, selectedMonth),
    };
  }, [habits, selectedMonth]);

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

  const weekDays = getLastSevenDays(today);
  const weekAverage = Math.round(
    weekDays.reduce((sum, day) => {
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

      return sum + dayPercent;
    }, 0) / weekDays.length
  );

  return (
    <main className="min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      {needsOnboarding && userId && (
        <ProfileOnboarding userId={userId} onComplete={completeOnboarding} />
      )}
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />
        <section className="relative flex min-h-dvh flex-col px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
          <header className="-mx-5 px-5 pb-5 pt-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686]">
              <CalendarDays size={15} />
              Habit analytics
            </p>
            <h1 className="mt-3 text-[44px] font-black leading-none tracking-[-0.06em] text-white">
              Stats
            </h1>
            <p className="mt-3 max-w-[320px] text-[15px] font-medium leading-6 text-[#8c9686]">
              See consistency over time and spot the habits that need more care.
            </p>
          </header>

          {errorMessage && (
            <div className="mb-4 rounded-[26px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <p className="text-sm font-semibold text-[#8c9686]">
                Loading stats...
              </p>
            </div>
          ) : (
            <>
              <motion.section
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="w-full shrink-0 rounded-[30px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#8c9686]">
                      Last 7 days
                    </p>
                    <h2 className="mt-1 text-[21px] font-bold tracking-[-0.025em] text-white">
                      Weekly overview
                    </h2>
                  </div>
                  <p className="rounded-full bg-[#c6ff3d]/15 px-3 py-1.5 text-[13px] font-bold text-[#d8ff69] ring-1 ring-[#c6ff3d]/20">
                    {weekAverage}%
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
                          day.isToday
                            ? "bg-[#c6ff3d]/12 ring-1 ring-[#c6ff3d]/20"
                            : "bg-transparent"
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold ${
                            day.isToday ? "text-[#d8ff69]" : "text-[#808a7c]"
                          }`}
                        >
                          {day.label.slice(0, 3)}
                        </p>

                        <div className="mt-2 flex h-16 w-5 items-end overflow-hidden rounded-full bg-white/[0.10]">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${dayPercent}%` }}
                            transition={{
                              duration: 0.55,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className={`w-full rounded-full ${
                              day.isToday
                                ? "bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.45)]"
                                : "bg-[#6f7a68]"
                            }`}
                          />
                        </div>

                        <p
                          className={`mt-2 text-[11px] font-semibold ${
                            day.isToday ? "text-[#d8ff69]" : "text-[#8c9686]"
                          }`}
                        >
                          {dayPercent}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

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
                      {stats.heatmap.label}
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
                  {stats.heatmap.cells.map((cell, index) =>
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

              <section className="mt-7 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[24px] font-black tracking-[-0.035em] text-white">
                    Habit insights
                  </h2>
                  <p className="text-sm font-semibold text-[#8c9686]">
                    {stats.habitInsights.length} habits
                  </p>
                </div>

                {stats.habitInsights.length === 0 && (
                  <div className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
                    <p className="text-lg font-bold tracking-[-0.02em] text-white">
                      No habits yet
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#8c9686]">
                      Add habits to see monthly consistency insights.
                    </p>
                  </div>
                )}

                {stats.habitInsights.map((habit, index) => (
                  <motion.article
                    key={habit.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: index * 0.035,
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="rounded-[30px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[18px] font-black tracking-[-0.025em] text-white">
                          {habit.name}
                        </h3>
                        <p className="mt-1 text-[13px] font-semibold text-[#8c9686]">
                          {habit.completed} of {habit.due} due
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[26px] font-black leading-none tracking-[-0.05em] text-white">
                          {habit.percent}
                          <span className="text-[14px] text-[#c6ff3d]">%</span>
                        </p>
                        <p
                          className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusClass(habit.status)}`}
                        >
                          {habit.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.10]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${habit.percent}%` }}
                        transition={{
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="h-full rounded-full bg-[#c6ff3d] shadow-[0_0_16px_rgba(198,255,61,0.40)]"
                      />
                    </div>
                  </motion.article>
                ))}
              </section>
            </>
          )}

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
