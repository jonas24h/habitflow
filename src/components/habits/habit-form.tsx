"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { Habit, HabitSchedule } from "@/types/habit";

const WEEKDAYS = [
  { label: "S", value: 0 },
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
];

function scheduleDefaults(schedule?: HabitSchedule) {
  return {
    type: schedule?.type ?? "daily",
    weeklyTarget: schedule?.type === "weekly_count" ? schedule.target : 4,
    weekdays: schedule?.type === "specific_days" ? schedule.weekdays : [1],
  };
}

export function HabitForm({
  habit,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  habit?: Habit;
  submitLabel?: string;
  onSubmit: (values: { name: string; schedule: HabitSchedule }) => void;
  onCancel?: () => void;
}) {
  const defaults = scheduleDefaults(habit?.schedule);

  const [name, setName] = useState(habit?.name ?? "");
  const [scheduleType, setScheduleType] =
    useState<HabitSchedule["type"]>(defaults.type);
  const [weeklyTarget, setWeeklyTarget] = useState(defaults.weeklyTarget);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    defaults.weekdays
  );

  function getSelectedSchedule(): HabitSchedule {
    if (scheduleType === "weekly_count") {
      return { type: "weekly_count", target: weeklyTarget };
    }

    if (scheduleType === "specific_days") {
      return {
        type: "specific_days",
        weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : [0],
      };
    }

    return { type: "daily" };
  }

  function resetForm() {
    if (habit) return;

    setName("");
    setScheduleType("daily");
    setWeeklyTarget(4);
    setSelectedWeekdays([1]);
  }

  function saveHabit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSubmit({
      name: trimmedName,
      schedule: getSelectedSchedule(),
    });

    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveHabit();
  }

  function toggleSelectedWeekday(weekday: number) {
    setSelectedWeekdays((current) => {
      if (current.includes(weekday)) {
        const next = current.filter((day) => day !== weekday);
        return next.length > 0 ? next : current;
      }

      return [...current, weekday].sort();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      method="post"
      action="#"
      noValidate
      className="w-full rounded-[34px] border border-white/10 bg-white/[0.08] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
    >
      <div className="flex gap-2">
        <input
          id="new-habit-input"
          name="new-habit-input-field"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Habit name"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          inputMode="text"
          className="h-[54px] min-w-0 flex-1 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[15px] font-semibold text-white outline-none placeholder:text-[#667061] focus:border-[#c6ff3d]/35 focus:bg-black/35"
        />

        <button
          type="submit"
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[23px] bg-[#c6ff3d] text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.30)] active:scale-95"
          aria-label={submitLabel ?? "Save habit"}
        >
          {habit ? <Check size={21} /> : <Plus size={21} />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-[24px] bg-black/25 p-1 ring-1 ring-white/10">
        {[
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly_count" },
          { label: "Days", value: "specific_days" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setScheduleType(option.value as HabitSchedule["type"])
            }
            className={`h-10 rounded-[20px] text-[13px] font-bold transition ${
              scheduleType === option.value
                ? "bg-[#c6ff3d] text-[#081006] shadow-[0_8px_22px_rgba(198,255,61,0.24)]"
                : "text-[#8c9686]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {scheduleType === "weekly_count" && (
          <motion.div
            key="weekly-target"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-3 flex items-center justify-between rounded-[24px] bg-black/25 px-4 py-3 ring-1 ring-white/10"
          >
            <span className="text-[13px] font-semibold text-[#8c9686]">
              Times per week
            </span>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setWeeklyTarget(target)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition ${
                    weeklyTarget === target
                      ? "bg-[#c6ff3d] text-[#081006]"
                      : "bg-white/10 text-[#8c9686]"
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {scheduleType === "specific_days" && (
          <motion.div
            key="specific-days"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-3 grid grid-cols-7 gap-1.5 rounded-[24px] bg-black/25 p-2 ring-1 ring-white/10"
          >
            {WEEKDAYS.map((weekday) => {
              const selected = selectedWeekdays.includes(weekday.value);

              return (
                <button
                  key={weekday.value}
                  type="button"
                  onClick={() => toggleSelectedWeekday(weekday.value)}
                  className={`flex h-9 items-center justify-center rounded-[16px] text-[13px] font-bold transition ${
                    selected
                      ? "bg-[#c6ff3d] text-[#081006]"
                      : "bg-white/10 text-[#8c9686]"
                  }`}
                >
                  {weekday.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 h-10 w-full rounded-[18px] text-sm font-bold text-[#8c9686] active:scale-[0.99]"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
