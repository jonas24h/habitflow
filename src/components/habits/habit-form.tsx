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
      className="w-full rounded-[28px] bg-white/90 p-3 shadow-[0_14px_36px_rgba(26,31,44,0.06)] ring-1 ring-black/[0.035]"
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
          className="h-[52px] min-w-0 flex-1 rounded-[21px] bg-[#f2f3f5] px-4 text-[15px] font-medium text-[#1d1d1f] outline-none placeholder:text-[#9aa1ab]"
        />

        <button
          type="submit"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[21px] bg-[#007aff] text-white shadow-[0_10px_24px_rgba(0,122,255,0.22)] active:scale-95"
          aria-label={submitLabel ?? "Save habit"}
        >
          {habit ? <Check size={21} /> : <Plus size={21} />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-[22px] bg-[#f2f3f5] p-1">
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
            className={`h-9 rounded-[18px] text-[13px] font-semibold transition ${
              scheduleType === option.value
                ? "bg-white text-[#1d1d1f] shadow-[0_5px_16px_rgba(26,31,44,0.08)]"
                : "text-[#858b96]"
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
            className="mt-3 flex items-center justify-between rounded-[22px] bg-[#f2f3f5] px-4 py-3"
          >
            <span className="text-[13px] font-medium text-[#656b75]">
              Times per week
            </span>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setWeeklyTarget(target)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition ${
                    weeklyTarget === target
                      ? "bg-[#007aff] text-white"
                      : "bg-white text-[#858b96]"
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
            className="mt-3 grid grid-cols-7 gap-1.5 rounded-[22px] bg-[#f2f3f5] p-2"
          >
            {WEEKDAYS.map((weekday) => {
              const selected = selectedWeekdays.includes(weekday.value);

              return (
                <button
                  key={weekday.value}
                  type="button"
                  onClick={() => toggleSelectedWeekday(weekday.value)}
                  className={`flex h-9 items-center justify-center rounded-[16px] text-[13px] font-semibold transition ${
                    selected
                      ? "bg-[#007aff] text-white"
                      : "bg-white text-[#858b96]"
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
          className="mt-3 h-10 w-full rounded-[18px] text-sm font-semibold text-[#858b96] active:scale-[0.99]"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
