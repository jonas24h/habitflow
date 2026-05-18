import { Habit } from "@/types/habit";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getHabitStreak(habit: Habit) {
  let streak = 0;

  const dates = new Set(habit.completedDates);

  for (let i = 0; i < 365; i++) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    if (dates.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}