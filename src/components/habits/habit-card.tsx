import { Check, Circle, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

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
      className={`rounded-[32px] border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-2xl transition ${
        completed
          ? "border-[#c6ff3d]/35 bg-[#c6ff3d]/10 shadow-[0_18px_50px_rgba(198,255,61,0.10)]"
          : "border-white/10 bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <motion.button
          type="button"
          onClick={() => onToggle(habit.id)}
          whileTap={{ scale: 0.92 }}
          animate={{
            backgroundColor: completed ? "#c6ff3d" : "rgba(255,255,255,0.08)",
            boxShadow: completed
              ? "0 14px 32px rgba(198, 255, 61, 0.32)"
              : "inset 0 1px 0 rgba(255,255,255,0.08)",
            color: completed ? "#081006" : "#8c9686",
            scale: completed ? 1.03 : 1,
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[25px] border border-white/10"
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

        <Link
          href={`/habits/${habit.id}`}
          className="min-w-0 flex-1 text-left transition active:scale-[0.99]"
        >
          <span
            className={`block truncate text-[18px] font-black tracking-[-0.025em] transition ${
              completed ? "text-[#d8ff69]" : "text-white"
            }`}
          >
            {habit.name}
          </span>

          <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#8c9686]">
            {completed ? (
              <Check size={15} className="text-[#c6ff3d]" strokeWidth={2.7} />
            ) : (
              <Circle size={15} className="text-[#687264]" strokeWidth={2.4} />
            )}
            {completed && habit.schedule.type !== "weekly_count"
              ? "Done today"
              : scheduleLabel}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => onDelete(habit.id)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#667061] transition hover:bg-white/10 hover:text-[#ff6b6b] active:scale-95"
          aria-label="Delete habit"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.article>
  );
}
