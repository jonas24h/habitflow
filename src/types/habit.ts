export type HabitSchedule =
  | {
      type: "daily";
    }
  | {
      type: "weekly_count";
      target: number;
    }
  | {
      type: "specific_days";
      weekdays: number[];
    };

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  completedDates: string[];
  schedule: HabitSchedule;
};
