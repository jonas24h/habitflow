import type { Habit, HabitSchedule } from "@/types/habit";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DISPLAY_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const HABIT_STORAGE_KEY = "habitflow-habits";

export const STARTER_HABITS: Habit[] = [
  {
    id: "starter-water",
    name: "Drink water",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
    schedule: { type: "daily" },
  },
  {
    id: "starter-walk",
    name: "Gym",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
    schedule: { type: "weekly_count", target: 4 },
  },
  {
    id: "starter-read",
    name: "Church",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
    schedule: { type: "specific_days", weekdays: [0] },
  },
];

export function normalizeHabitSchedule(schedule: unknown): HabitSchedule {
  if (
    schedule &&
    typeof schedule === "object" &&
    "type" in schedule &&
    schedule.type === "weekly_count"
  ) {
    const target =
      "target" in schedule && typeof schedule.target === "number"
        ? schedule.target
        : 1;

    return {
      type: "weekly_count",
      target: Math.max(1, Math.min(7, Math.round(target))),
    };
  }

  if (
    schedule &&
    typeof schedule === "object" &&
    "type" in schedule &&
    schedule.type === "specific_days"
  ) {
    const weekdays =
      "weekdays" in schedule && Array.isArray(schedule.weekdays)
        ? schedule.weekdays.filter(
            (weekday): weekday is number =>
              Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
          )
        : [];

    return {
      type: "specific_days",
      weekdays: weekdays.length > 0 ? [...new Set(weekdays)].sort() : [0],
    };
  }

  return { type: "daily" };
}

export function todayKey() {
  return dateKey();
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekDateKeys(key: string) {
  if (!key) return [];

  const date = fromDateKey(key);
  const start = new Date(date);

  start.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);

    return dateKey(day);
  });
}

export function getWeeklyCompletionCount(habit: Habit, key: string) {
  if (!key) return 0;

  const weekKeys = new Set(getWeekDateKeys(key));

  return habit.completedDates.filter((completedDate) =>
    weekKeys.has(completedDate)
  ).length;
}

export function getWeeklyRemainingCount(habit: Habit, key: string) {
  const schedule = normalizeHabitSchedule(habit.schedule);
  if (schedule.type !== "weekly_count") return 0;

  return Math.max(
    0,
    schedule.target - getWeeklyCompletionCount(habit, key)
  );
}

export function isHabitDueOnDate(habit: Habit, key: string) {
  if (!key) return false;

  const schedule = normalizeHabitSchedule(habit.schedule);

  switch (schedule.type) {
    case "daily":
      return true;
    case "weekly_count":
      return getWeeklyCompletionCount(habit, key) < schedule.target;
    case "specific_days":
      return schedule.weekdays.includes(fromDateKey(key).getDay());
    default:
      return true;
  }
}

export function getDueHabitsForDate(habits: Habit[], key: string) {
  return habits.filter((habit) => isHabitDueOnDate(habit, key));
}

export function getHabitScheduleLabel(habit: Habit, key: string) {
  const schedule = normalizeHabitSchedule(habit.schedule);

  switch (schedule.type) {
    case "daily":
      return isHabitDueOnDate(habit, key) ? "Due today" : "Daily";
    case "weekly_count": {
      const remaining = getWeeklyRemainingCount(habit, key);

      if (remaining === 0) return "Weekly goal complete";

      return `${remaining} time${remaining === 1 ? "" : "s"} left this week`;
    }
    case "specific_days": {
      const scheduledWeekdays = new Set(schedule.weekdays);
      const days = DISPLAY_WEEKDAY_ORDER
        .filter((weekday) => scheduledWeekdays.has(weekday))
        .map((weekday) => WEEKDAY_LABELS[weekday])
        .filter(Boolean);

      if (days.length === 1) {
        return `Every ${FULL_WEEKDAY_LABELS[schedule.weekdays[0]]}`;
      }

      return days.join(", ");
    }
    default:
      return "Due today";
  }
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
