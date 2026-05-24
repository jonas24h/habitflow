"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { DeleteHabitSheet } from "@/components/habits/delete-habit-sheet";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitManagementList } from "@/components/habits/habit-management-list";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboarding } from "@/components/onboarding/profile-onboarding";
import { dateKey } from "@/lib/habits";
import {
  createHabit as createHabitInSupabase,
  deleteHabit as deleteHabitFromSupabase,
  fetchHabits,
  updateHabit as updateHabitInSupabase,
} from "@/lib/habit-service";
import { fetchProfile } from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitSchedule } from "@/types/habit";

const MotionLink = motion.create(Link);
const QUICK_EASE = [0.2, 0.8, 0.2, 1] as const;

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [today, setToday] = useState("");
  const [userId, setUserId] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHabits(nextUserId: string) {
      setToday(dateKey());

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

  function completeOnboarding() {
    setNeedsOnboarding(false);
    setErrorMessage("");
  }

  async function addHabit(values: { name: string; schedule: HabitSchedule }) {
    if (!userId) return;

    try {
      const habit = await createHabitInSupabase(
        userId,
        values.name,
        values.schedule
      );
      setHabits((current) => [habit, ...current]);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create habit.");
    }
  }

  async function updateHabit(
    id: string,
    values: { name: string; schedule: HabitSchedule }
  ) {
    if (!userId) return;

    try {
      const updatedHabit = await updateHabitInSupabase(userId, id, values);

      setHabits((current) =>
        current.map((habit) =>
          habit.id === id
            ? { ...updatedHabit, completedDates: habit.completedDates }
            : habit
        )
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not update habit.");
    }
  }

  async function deleteHabit() {
    if (!userId || !habitToDelete) return;

    try {
      setIsDeleting(true);
      await deleteHabitFromSupabase(userId, habitToDelete.id);
      setHabits((current) =>
        current.filter((habit) => habit.id !== habitToDelete.id)
      );
      setHabitToDelete(null);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not delete habit.");
    } finally {
      setIsDeleting(false);
    }
  }

  const visibleHabits = isLoading ? [] : habits;

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
                <MotionLink
                  href="/"
                  className="inline-flex touch-manipulation items-center gap-1.5 text-[13px] font-semibold text-[#8c9686] transition-transform duration-150"
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12, ease: QUICK_EASE }}
                >
                  <ArrowLeft size={15} />
                  Today
                </MotionLink>
                <h1 className="mt-3 text-[40px] font-black leading-none tracking-[-0.05em]">
                  Habits
                </h1>
              </div>

              <div className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] px-3 text-[13px] font-black text-[#d8ff69] shadow-[0_8px_20px_rgba(190,255,79,0.10)] backdrop-blur-md">
                {visibleHabits.length}
              </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: QUICK_EASE }}
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
                {isLoading ? "Loading" : `${visibleHabits.length} active`}
              </p>
            </div>

            {isLoading && (
              <div className="rounded-[34px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur-md">
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

            {!isLoading && (
              <HabitManagementList
                habits={visibleHabits}
                today={today}
                onUpdate={updateHabit}
                onDelete={setHabitToDelete}
              />
            )}
          </section>

          <BottomNav />
        </section>
        <DeleteHabitSheet
          habit={habitToDelete}
          isDeleting={isDeleting}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setHabitToDelete(null);
          }}
          onConfirm={deleteHabit}
        />
      </div>
    </main>
  );
}
