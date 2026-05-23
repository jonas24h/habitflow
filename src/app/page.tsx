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
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, Plus } from "lucide-react";
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
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState("");
  const [formattedDate, setFormattedDate] = useState("Today");
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
  const weekDays = getLastSevenDays(activeToday);
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
                  Good morning
                </p>
                <h1 className="mt-1 text-[40px] font-bold leading-none tracking-[-0.04em]">
                  {username}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] px-3 text-[13px] font-bold text-[#d8ff69] shadow-[0_10px_30px_rgba(190,255,79,0.12)] backdrop-blur-xl"
                >
                  {progressPercent}%
                </motion.div>

                <Link
                  href="/habits"
                  className="pointer-events-auto flex h-[52px] w-[52px] shrink-0 touch-manipulation items-center justify-center rounded-[22px] bg-[#c6ff3d] text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.30)] transition active:scale-95"
                  aria-label="Manage habits"
                >
                  <Plus size={21} />
                </Link>
              </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
            className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#c6ff3d]/20 blur-3xl" />
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
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
                className="h-full rounded-full bg-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.45)]"
              />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 w-full shrink-0 rounded-[30px] border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
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
                      day.isToday ? "bg-[#c6ff3d]/12 ring-1 ring-[#c6ff3d]/20" : "bg-transparent"
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
                          day.isToday ? "bg-[#c6ff3d] shadow-[0_0_14px_rgba(198,255,61,0.45)]" : "bg-[#6f7a68]"
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
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#c6ff3d] text-[#081006] shadow-[0_12px_28px_rgba(198,255,61,0.28)]">
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.06] p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
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
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 flex flex-col gap-3.5"
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
          </section>

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
