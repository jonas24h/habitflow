import { normalizeHabitSchedule } from "@/lib/habits";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitSchedule } from "@/types/habit";

type HabitRow = {
  id: string;
  name: string;
  schedule: unknown;
  created_at: string;
};

type HabitLogRow = {
  habit_id: string;
  date: string;
};

function toHabit(row: HabitRow, completedDates: string[] = []): Habit {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    completedDates: [...completedDates].sort(),
    schedule: normalizeHabitSchedule(row.schedule),
  };
}

function createFallbackId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function fetchHabits(userId: string) {
  const { data: habitRows, error: habitsError } = await supabase
    .from("habits")
    .select("id,name,schedule,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (habitsError) {
    throw habitsError;
  }

  const { data: logRows, error: logsError } = await supabase
    .from("habit_logs")
    .select("habit_id,date")
    .eq("user_id", userId);

  if (logsError) {
    throw logsError;
  }

  const completedDatesByHabit = new Map<string, string[]>();

  (logRows ?? []).forEach((log: HabitLogRow) => {
    const dates = completedDatesByHabit.get(log.habit_id) ?? [];
    completedDatesByHabit.set(log.habit_id, [...dates, log.date]);
  });

  return (habitRows ?? []).map((habit: HabitRow) =>
    toHabit(habit, completedDatesByHabit.get(habit.id) ?? [])
  );
}

export async function createHabit(
  userId: string,
  name: string,
  schedule: HabitSchedule
) {
  const id = createFallbackId();

  const { data, error } = await supabase
    .from("habits")
    .insert({
      id,
      user_id: userId,
      name,
      schedule,
    })
    .select("id,name,schedule,created_at")
    .single();

  if (error) {
    throw error;
  }

  return toHabit(data);
}

export async function updateHabit(
  userId: string,
  id: string,
  values: { name: string; schedule: HabitSchedule }
) {
  const { data, error } = await supabase
    .from("habits")
    .update({
      name: values.name,
      schedule: values.schedule,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id,name,schedule,created_at")
    .single();

  if (error) {
    throw error;
  }

  return toHabit(data);
}

export async function deleteHabit(userId: string, id: string) {
  const { error: logsError } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", id)
    .eq("user_id", userId);

  if (logsError) {
    throw logsError;
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function toggleHabitCompletion(
  userId: string,
  habit: Habit,
  date: string
) {
  const completed = habit.completedDates.includes(date);

  if (completed) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habit.id)
      .eq("user_id", userId)
      .eq("date", date);

    if (error) {
      throw error;
    }

    return {
      ...habit,
      completedDates: habit.completedDates.filter(
        (completedDate) => completedDate !== date
      ),
    };
  }

  const { error } = await supabase.from("habit_logs").insert({
    user_id: userId,
    habit_id: habit.id,
    date,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  return {
    ...habit,
    completedDates: [...habit.completedDates, date].sort(),
  };
}
