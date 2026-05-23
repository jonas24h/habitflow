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
import { CalendarDays, CheckCircle2, Flame, Percent, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en", { weekday: "short" });
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

type DayOverview = {
  key: string;
  label: string;
  completed: number;
  total: number;
  percent: number;
};

function getHabitsForDateOverview(habits: Habit[], key: string) {
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

function getDateRange(endKey: string, days: number) {
  const end = fromDateKey(endKey);

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (days - 1 - index));
    return dateKey(day);
  });
}

function getCheckInDates(habits: Habit[]) {
  return habits.flatMap((habit) => habit.completedDates);
}

function getCurrentStreak(completedDateKeys: Set<string>, today: string) {
  let streak = 0;
  const date = fromDateKey(today);

  while (completedDateKeys.has(dateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function getBestStreak(completedDateKeys: Set<string>) {
  const sortedKeys = [...completedDateKeys].sort();
  let best = 0;
  let current = 0;
  let previousDate: Date | null = null;

  sortedKeys.forEach((key) => {
    const currentDate = fromDateKey(key);
    const isNextDay =
      previousDate &&
      Math.round(
        (currentDate.getTime() - previousDate.getTime()) / 86_400_000
      ) === 1;

    current = isNextDay ? current + 1 : 1;
    best = Math.max(best, current);
    previousDate = currentDate;
  });

  return best;
}

function getDayOverview(habits: Habit[], key: string): DayOverview {
  const dueHabits = getHabitsForDateOverview(habits, key);
  const completed = dueHabits.filter((habit) =>
    habit.completedDates.includes(key)
  ).length;
  const percent =
    dueHabits.length === 0 ? 0 : Math.round((completed / dueHabits.length) * 100);

  return {
    key,
    label: WEEKDAY_FORMATTER.format(fromDateKey(key)).slice(0, 3),
    completed,
    total: dueHabits.length,
    percent,
  };
}

function getMonthlyHeatmap(habits: Habit[], today: string) {
  const currentDate = fromDateKey(today);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const blanks = Array.from({ length: firstWeekday }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) =>
    getDayOverview(habits, dateKey(new Date(year, month, index + 1)))
  );

  return {
    label: MONTH_FORMATTER.format(currentDate),
    cells: [...blanks, ...days],
  };
}

function heatClass(percent: number) {
  if (percent >= 90) return "bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.35)]";
  if (percent >= 60) return "bg-[#9bd737]";
  if (percent >= 30) return "bg-[#58752b]";
  if (percent > 0) return "bg-[#26351b]";
  return "bg-white/[0.08]";
}

export default function StatsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userId, setUserId] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const today = dateKey();

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
    const checkInDates = getCheckInDates(habits);
    const completedDateKeys = new Set(checkInDates);
    const lastThirtyDays = getDateRange(today, 30).map((key) =>
      getDayOverview(habits, key)
    );
    const completedOpportunities = lastThirtyDays.reduce(
      (sum, day) => sum + day.completed,
      0
    );
    const totalOpportunities = lastThirtyDays.reduce(
      (sum, day) => sum + day.total,
      0
    );
    const completionRate =
      totalOpportunities === 0
        ? 0
        : Math.round((completedOpportunities / totalOpportunities) * 100);

    return {
      currentStreak: getCurrentStreak(completedDateKeys, today),
      bestStreak: getBestStreak(completedDateKeys),
      completionRate,
      totalCheckIns: checkInDates.length,
      lastSevenDays: lastThirtyDays.slice(-7),
      heatmap: getMonthlyHeatmap(habits, today),
    };
  }, [habits, today]);

  function completeOnboarding() {
    setNeedsOnboarding(false);
    setErrorMessage("");
  }

  const statCards = [
    {
      label: "Current streak",
      value: stats.currentStreak,
      suffix: "d",
      icon: Flame,
    },
    {
      label: "Best streak",
      value: stats.bestStreak,
      suffix: "d",
      icon: Trophy,
    },
    {
      label: "Completion",
      value: stats.completionRate,
      suffix: "%",
      icon: Percent,
    },
    {
      label: "Check-ins",
      value: stats.totalCheckIns,
      suffix: "",
      icon: CheckCircle2,
    },
  ];

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
              Last 30 days
            </p>
            <h1 className="mt-3 text-[44px] font-black leading-none tracking-[-0.06em] text-white">
              Stats
            </h1>
            <p className="mt-3 max-w-[300px] text-[15px] font-medium leading-6 text-[#8c9686]">
              Momentum, streaks, and check-ins across your habit flow.
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
              <section className="grid grid-cols-2 gap-3">
                {statCards.map((card, index) => {
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
                      <p className="mt-5 text-[40px] font-black leading-none tracking-[-0.06em] text-white">
                        {card.value}
                        <span className="text-[20px] text-[#c6ff3d]">
                          {card.suffix}
                        </span>
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#8c9686]">
                        {card.label}
                      </p>
                    </motion.div>
                  );
                })}
              </section>

              <section className="mt-4 rounded-[34px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#8c9686]">
                      Last 7 days
                    </p>
                    <h2 className="mt-1 text-[22px] font-black tracking-[-0.035em] text-white">
                      Daily rhythm
                    </h2>
                  </div>
                  <p className="rounded-full bg-[#c6ff3d]/15 px-3 py-1.5 text-[13px] font-bold text-[#d8ff69] ring-1 ring-[#c6ff3d]/20">
                    {stats.completionRate}%
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2">
                  {stats.lastSevenDays.map((day) => (
                    <div
                      key={day.key}
                      className="flex min-w-0 flex-col items-center rounded-[20px] bg-black/15 px-1.5 py-2.5"
                    >
                      <p className="text-[11px] font-semibold text-[#808a7c]">
                        {day.label}
                      </p>
                      <div className="mt-2 flex h-20 w-5 items-end overflow-hidden rounded-full bg-white/[0.10]">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${day.percent}%` }}
                          transition={{
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="w-full rounded-full bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.45)]"
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-[#8c9686]">
                        {day.percent}%
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-4 rounded-[34px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#8c9686]">
                      Monthly heatmap
                    </p>
                    <h2 className="mt-1 text-[22px] font-black tracking-[-0.035em] text-white">
                      {stats.heatmap.label}
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2">
                  {stats.heatmap.cells.map((cell, index) =>
                    cell ? (
                      <div
                        key={cell.key}
                        className={`aspect-square rounded-[10px] ${heatClass(cell.percent)}`}
                        title={`${cell.key}: ${cell.percent}%`}
                      />
                    ) : (
                      <div key={`blank-${index}`} className="aspect-square" />
                    )
                  )}
                </div>
              </section>
            </>
          )}

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
