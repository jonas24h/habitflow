"use client";

import { HabitCard } from "@/components/habits/habit-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboarding } from "@/components/onboarding/profile-onboarding";
import {
  dateKey,
  fromDateKey,
  getDueHabitsForDate,
  isHabitDueOnDate,
} from "@/lib/habits";
import {
  deleteHabit as deleteHabitFromSupabase,
  fetchHabits,
  toggleHabitCompletion,
} from "@/lib/habit-service";
import { fetchProfile, type Profile } from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";
import type { Habit } from "@/types/habit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Flame,
  Plus,
  Trophy,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const MotionLink = motion.create(Link);

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
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

export default function HomePage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState("");
  const [formattedDate, setFormattedDate] = useState("Today");
  const [greeting, setGreeting] = useState("Hi");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHabits(nextUserId: string) {
      const currentDate = new Date();

      setToday(dateKey(currentDate));
      setFormattedDate(DATE_FORMATTER.format(currentDate));
      setGreeting(getGreeting(currentDate));

      try {
        const nextHabits = await fetchHabits(nextUserId);

        if (cancelled) return;

        setHabits(nextHabits);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setErrorMessage("Could not load habits from Supabase.");
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

        if (profile) {
          setUsername(profile.username);
          setNeedsOnboarding(false);
        } else {
          setUsername("");
          setNeedsOnboarding(true);
        }
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

  function completeOnboarding(profile: Profile) {
    setUsername(profile.username);
    setNeedsOnboarding(false);
    setErrorMessage("");
  }

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
  const streakStats = useMemo(() => {
    const completedDateKeys = new Set(getCheckInDates(habits));

    return {
      currentStreak: getCurrentStreak(completedDateKeys, activeToday),
      bestStreak: getBestStreak(completedDateKeys),
    };
  }, [habits, activeToday]);

  const statCards = [
    {
      label: "Current streak",
      value: streakStats.currentStreak,
      icon: Flame,
    },
    {
      label: "Best streak",
      value: streakStats.bestStreak,
      icon: Trophy,
    },
  ];

  async function toggleHabit(id: string, day = activeToday) {
    if (!day) return;

    const habit = habits.find((currentHabit) => currentHabit.id === id);
    if (!habit || !userId) return;

    try {
      const updatedHabit = await toggleHabitCompletion(userId, habit, day);

      setHabits((current) =>
        current.map((currentHabit) =>
          currentHabit.id === id ? updatedHabit : currentHabit
        )
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update habit completion.");
    }
  }

  async function deleteHabit(id: string) {
    if (!userId) return;

    try {
      await deleteHabitFromSupabase(userId, id);
      setHabits((current) => current.filter((habit) => habit.id !== id));
      setErrorMessage("");
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686]">
                  <CalendarDays size={15} />
                  {formattedDate}
                </p>
                <p className="mt-3 text-[15px] font-medium text-[#8c9686]">
                  {greeting}
                </p>
                <h1 className="mt-1 text-[40px] font-bold leading-none tracking-[-0.04em]">
                  {username}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] px-3 text-[13px] font-bold text-[#d8ff69] shadow-[0_8px_20px_rgba(190,255,79,0.10)] backdrop-blur-md transform-gpu"
                >
                  {progressPercent}%
                </motion.div>

                <MotionLink
                  href="/habits"
                  className="pointer-events-auto flex h-[52px] w-[52px] shrink-0 touch-manipulation items-center justify-center rounded-[22px] bg-[#c6ff3d] text-[#081006] shadow-[0_10px_24px_rgba(198,255,61,0.24)] transform-gpu"
                  aria-label="Manage habits"
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <Plus size={21} />
                </MotionLink>
              </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_16px_42px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)] [clip-path:inset(0_round_36px)] backdrop-blur-md transform-gpu"
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[#c6ff3d]/14 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[#9fa895]">
                  Daily momentum
                </p>
                <p className="mt-3 text-[54px] font-black leading-none tracking-[-0.07em] text-white">
                  {progressPercent}
                  <span className="text-[28px] text-[#c6ff3d]">%</span>
                </p>
                <p className="mt-3 text-[15px] font-medium text-[#9fa895]">
                  {completedToday} of {dueTodayCount} due habits complete
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-[#c6ff3d] text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.28)]">
                <Dumbbell size={24} />
              </div>
            </div>
            <div className="relative mt-7 h-3 overflow-hidden rounded-full bg-white/[0.10]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                className="h-full rounded-full bg-[#c6ff3d] shadow-[0_0_12px_rgba(198,255,61,0.34)] transform-gpu"
              />
            </div>
          </motion.section>

          <section className="mt-4 grid grid-cols-2 gap-3">
            {statCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.02,
                    duration: 0.2,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className="rounded-[30px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transform-gpu"
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

          <section className="mt-7 flex flex-1 flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-black tracking-[-0.035em] text-white">
                Today
              </h2>
              <p className="text-sm font-semibold text-[#8c9686]">
                {remainingToday} left
              </p>
            </div>

            {isLoading && (
              <div className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <p className="text-sm font-semibold text-[#8c9686]">
                  Loading habits...
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-[26px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
                {errorMessage}
              </div>
            )}

            <LayoutGroup>
              <AnimatePresence initial={false}>
                {!isLoading && todoHabitsToday.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    index={index}
                    today={activeToday}
                    onToggle={toggleHabit}
                    onDelete={deleteHabit}
                  />
                ))}

                {!isLoading && habits.length > 0 && todoHabitsToday.length === 0 && (
                  <motion.div
                    key="today-complete"
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.985 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur-md transform-gpu"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#c6ff3d] text-[#081006] shadow-[0_10px_22px_rgba(198,255,61,0.22)]">
                      <CheckCircle2 size={22} />
                    </div>
                    <p className="mt-4 text-lg font-bold tracking-[-0.02em] text-white">
                      {dueTodayCount === 0
                        ? "Nothing is due today"
                        : "You are done for today"}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#8c9686]">
                      {dueTodayCount === 0
                        ? "Scheduled habits will appear when they are due."
                        : "All due habits are checked off."}
                    </p>
                  </motion.div>
                )}

                {!isLoading && habits.length === 0 && (
                  <motion.div
                    key="empty-habits"
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-md transform-gpu"
                  >
                    <p className="text-lg font-bold tracking-[-0.02em] text-white">
                      No habits yet
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#8c9686]">
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mt-3 flex flex-col gap-3.5 transform-gpu"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-[24px] font-black tracking-[-0.035em] text-white">
                        Done today
                      </h2>
                      <p className="text-sm font-semibold text-[#8c9686]">
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
            </LayoutGroup>
          </section>

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
