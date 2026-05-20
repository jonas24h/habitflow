import { getHabitScheduleLabel } from "@/lib/habits";
import type { Habit, HabitSchedule } from "@/types/habit";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getScheduleSummary(schedule: HabitSchedule) {
  if (schedule.type === "daily") return "Every day";

  if (schedule.type === "weekly_count") {
    return `${schedule.target} time${schedule.target === 1 ? "" : "s"} per week`;
  }

  if (schedule.weekdays.length === 1 && schedule.weekdays[0] === 0) {
    return "Every Sunday";
  }

  return schedule.weekdays
    .map((weekday) => WEEKDAY_LABELS[weekday])
    .filter(Boolean)
    .join(", ");
}

export function ScheduleSummary({
  habit,
  today,
}: {
  habit: Habit;
  today: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[#858b96]">
        {getScheduleSummary(habit.schedule)}
      </span>
      <span className="text-xs font-medium text-[#a1a7b1]">
        {getHabitScheduleLabel(habit, today)}
      </span>
    </div>
  );
}
