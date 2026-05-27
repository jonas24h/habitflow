import { dateKey, fromDateKey, isHabitDueOnDate } from "@/lib/habits";
import type { Habit } from "@/types/habit";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

export type DayOverview = {
  key: string;
  completed: number;
  total: number;
  percent: number;
};

export type HabitInsightStatus = "Strong" | "Steady" | "Needs attention";

export type HabitInsight = {
  id: string;
  name: string;
  completed: number;
  due: number;
  percent: number;
  status: HabitInsightStatus;
};

export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthDateKeys(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    dateKey(new Date(year, monthIndex, index + 1))
  );
}

export function isHabitDueForAnalytics(habit: Habit, key: string) {
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

export function getDayOverview(habits: Habit[], key: string): DayOverview {
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

export function getMonthlyHeatmap(habits: Habit[], month: Date) {
  const firstWeekday = (getMonthStart(month).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstWeekday }, () => null);
  const days = getMonthDateKeys(month).map((key) => getDayOverview(habits, key));

  return {
    label: MONTH_FORMATTER.format(month),
    cells: [...blanks, ...days],
  };
}

export function getHabitStatus(percent: number): HabitInsightStatus {
  if (percent >= 80) return "Strong";
  if (percent >= 50) return "Steady";
  return "Needs attention";
}

export function getHabitInsights(habits: Habit[], month: Date) {
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

export function getCheckInDates(habits: Habit[]) {
  return habits.flatMap((habit) => habit.completedDates);
}

export function getCurrentStreak(completedDateKeys: Set<string>, today: string) {
  let streak = 0;
  const date = fromDateKey(today);

  while (completedDateKeys.has(dateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

export function getBestStreak(completedDateKeys: Set<string>) {
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
