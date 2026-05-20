import { Check, Circle, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { getHabitScheduleLabel } from "@/lib/habits";
import { Habit } from "@/types/habit";

type HabitCardProps = {
  habit: Habit;
  index: number;
  today: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function HabitCard({
  habit,
  index,
  today,
  onToggle,
  onDelete,
}: HabitCardProps) {
  const completed = habit.completedDates.includes(today);
  const scheduleLabel = getHabitScheduleLabel(habit, today);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14, scale: 0.98 }}
      animate={{
        opacity: completed ? 0.74 : 1,
        y: completed && !shouldReduceMotion ? 4 : 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : -10,
        scale: 0.98,
      }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.035,
        layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-[30px] bg-white/90 p-4 shadow-[0_14px_36px_rgba(26,31,44,0.06)] ring-1 ring-black/[0.035]"
    >
      <div className="flex items-center gap-3.5">
        <motion.button
          type="button"
          onClick={() => onToggle(habit.id)}
          whileTap={{ scale: 0.92 }}
          animate={{
            backgroundColor: completed ? "#34c759" : "#f2f3f5",
            boxShadow: completed
              ? "0 10px 24px rgba(52, 199, 89, 0.22)"
              : "0 0 0 rgba(52, 199, 89, 0)",
            color: completed ? "#ffffff" : "#a3aab4",
            scale: completed ? 1.03 : 1,
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[23px]"
          aria-label={completed ? "Mark habit as incomplete" : "Complete habit"}
        >
          <motion.span
            animate={{
              rotate: completed ? 0 : -8,
              scale: completed ? 1 : 0.92,
              opacity: completed ? 1 : 0.62,
            }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Check size={23} strokeWidth={2.7} />
          </motion.span>
        </motion.button>

        <button
          type="button"
          onClick={() => onToggle(habit.id)}
          className="min-w-0 flex-1 text-left transition active:scale-[0.99]"
        >
          <span
            className={`block truncate text-[17px] font-semibold tracking-[-0.012em] transition ${
              completed ? "text-[#656b75]" : "text-[#1d1d1f]"
            }`}
          >
            {habit.name}
          </span>

          <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-[#858b96]">
            {completed ? (
              <Check size={15} className="text-[#34c759]" strokeWidth={2.7} />
            ) : (
              <Circle size={15} className="text-[#a3aab4]" strokeWidth={2.4} />
            )}
            {completed && habit.schedule.type !== "weekly_count"
              ? "Done today"
              : scheduleLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(habit.id)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#c1c7d0] transition hover:bg-[#fff1f1] hover:text-[#ff3b30] active:scale-95"
          aria-label="Delete habit"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.article>
  );
}
