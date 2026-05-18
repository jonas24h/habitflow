"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Check,
  Flame,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

type Habit = {
  id: string;
  name: string;
  createdAt: string;
  completedDates: string[];
};

const STORAGE_KEY = "habitflow-habits";
const DAY_FORMATTER = new Intl.DateTimeFormat("en", { weekday: "short" });
const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

const STARTER_HABITS: Habit[] = [
  {
    id: "starter-water",
    name: "Drink water",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
  },
  {
    id: "starter-walk",
    name: "Take a walk",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
  },
  {
    id: "starter-read",
    name: "Read 10 pages",
    createdAt: "2026-01-01T08:00:00.000Z",
    completedDates: [],
  },
];

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function shiftDateKey(key: string, amount: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + amount);

  return dateKey(date);
}

function createHabit(name: string): Habit {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    name,
    createdAt: new Date().toISOString(),
    completedDates: [],
  };
}

function readStoredHabits() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return STARTER_HABITS;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return STARTER_HABITS;

    return parsed.filter(
      (habit): habit is Habit =>
        typeof habit?.id === "string" &&
        typeof habit?.name === "string" &&
        typeof habit?.createdAt === "string" &&
        Array.isArray(habit?.completedDates)
    );
  } catch {
    return STARTER_HABITS;
  }
}

function getStreak(habit: Habit, today: string) {
  const completed = new Set(habit.completedDates);
  let streak = 0;
  let cursor = today;

  while (completed.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window === "undefined") return STARTER_HABITS;

    return readStoredHabits();
  });
  const [newHabitName, setNewHabitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const today = dateKey();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const key = shiftDateKey(today, index - 6);
        const date = fromDateKey(key);

        return {
          key,
          day: DAY_FORMATTER.format(date),
          label: DATE_FORMATTER.format(date),
        };
      }),
    [today]
  );

  const completedToday = habits.filter((habit) =>
    habit.completedDates.includes(today)
  ).length;
  const totalCompletions = habits.reduce(
    (sum, habit) => sum + habit.completedDates.length,
    0
  );
  const bestStreak = habits.reduce(
    (best, habit) => Math.max(best, getStreak(habit, today)),
    0
  );
  const progressPercent =
    habits.length === 0 ? 0 : Math.round((completedToday / habits.length) * 100);

  function addHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newHabitName.trim();
    if (!name) return;

    setHabits((current) => [createHabit(name), ...current]);
    setNewHabitName("");
  }

  function toggleHabit(id: string, day = today) {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;

        const completed = habit.completedDates.includes(day);

        return {
          ...habit,
          completedDates: completed
            ? habit.completedDates.filter((date) => date !== day)
            : [...habit.completedDates, day].sort(),
        };
      })
    );
  }

  function startEditing(habit: Habit) {
    setEditingId(habit.id);
    setEditingName(habit.name);
  }

  function saveEditing() {
    const name = editingName.trim();

    if (editingId && name) {
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingId ? { ...habit, name } : habit
        )
      );
    }

    setEditingId(null);
    setEditingName("");
  }

  function deleteHabit(id: string) {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#171510]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-4 rounded-lg border border-[#ded6c9] bg-[#fffdf8] p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#6f6658]">
              <CalendarDays className="size-4" />
              {DATE_FORMATTER.format(new Date())}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              HabitFlow
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6658] sm:text-base">
              Track today, keep an eye on the week, and build streaks without
              turning your life into a spreadsheet.
            </p>
          </div>

          <div className="rounded-lg border border-[#d7cec0] bg-[#f3eadc] p-4 sm:min-w-48">
            <p className="text-sm font-medium text-[#6f6658]">Today</p>
            <p className="mt-1 text-3xl font-semibold">{progressPercent}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#d8cfbf]">
              <div
                className="h-full rounded-full bg-[#2f6f63] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Target className="size-5" />}
            label="Completed today"
            value={`${completedToday}/${habits.length}`}
          />
          <StatCard
            icon={<Flame className="size-5" />}
            label="Best live streak"
            value={`${bestStreak} day${bestStreak === 1 ? "" : "s"}`}
          />
          <StatCard
            icon={<BarChart3 className="size-5" />}
            label="All-time check-ins"
            value={String(totalCompletions)}
          />
        </div>

        <form
          onSubmit={addHabit}
          className="grid gap-3 rounded-lg border border-[#ded6c9] bg-[#fffdf8] p-4 shadow-sm sm:grid-cols-[1fr_auto]"
        >
          <label className="sr-only" htmlFor="new-habit">
            New habit
          </label>
          <input
            id="new-habit"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            placeholder="Add a habit, like meditate for 5 minutes"
            className="h-11 min-w-0 rounded-lg border border-[#d7cec0] bg-white px-3 text-sm outline-none transition placeholder:text-[#9a9184] focus:border-[#2f6f63] focus:ring-3 focus:ring-[#2f6f63]/20"
          />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2f6f63] px-4 text-sm font-semibold text-white transition hover:bg-[#24584f] focus:outline-none focus:ring-3 focus:ring-[#2f6f63]/25">
            <Plus className="size-4" />
            Add habit
          </button>
        </form>

        <section className="grid gap-4">
          {habits.map((habit) => {
            const completed = habit.completedDates.includes(today);
            const streak = getStreak(habit, today);

            return (
              <article
                key={habit.id}
                className="rounded-lg border border-[#ded6c9] bg-[#fffdf8] p-4 shadow-sm"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleHabit(habit.id)}
                      aria-label={
                        completed
                          ? `Mark ${habit.name} incomplete`
                          : `Mark ${habit.name} complete`
                      }
                      className={`flex size-11 shrink-0 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-3 focus:ring-[#2f6f63]/25 ${
                        completed
                          ? "border-[#2f6f63] bg-[#2f6f63] text-white"
                          : "border-[#d7cec0] bg-white text-[#8a8174] hover:border-[#2f6f63]"
                      }`}
                    >
                      <Check className="size-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      {editingId === habit.id ? (
                        <input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onBlur={saveEditing}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveEditing();
                            if (event.key === "Escape") {
                              setEditingId(null);
                              setEditingName("");
                            }
                          }}
                          autoFocus
                          className="h-10 w-full rounded-lg border border-[#d7cec0] bg-white px-3 text-base font-semibold outline-none focus:border-[#2f6f63] focus:ring-3 focus:ring-[#2f6f63]/20"
                        />
                      ) : (
                        <h2 className="truncate text-base font-semibold sm:text-lg">
                          {habit.name}
                        </h2>
                      )}
                      <p className="mt-1 flex items-center gap-2 text-sm text-[#6f6658]">
                        <Flame className="size-4 text-[#c65f2e]" />
                        {streak} day{streak === 1 ? "" : "s"} in a row
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <div className="grid grid-cols-7 gap-1.5">
                      {weekDays.map((day) => {
                        const checked = habit.completedDates.includes(day.key);

                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleHabit(habit.id, day.key)}
                            title={`${day.day}, ${day.label}`}
                            aria-label={`${habit.name} on ${day.day}, ${day.label}`}
                            className={`flex size-9 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2f6f63]/25 ${
                              checked
                                ? "border-[#2f6f63] bg-[#dceee8] text-[#184f45]"
                                : "border-[#ded6c9] bg-[#f8f1e6] text-[#756c60] hover:border-[#2f6f63]"
                            }`}
                          >
                            {day.day.slice(0, 1)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(habit)}
                        aria-label={`Edit ${habit.name}`}
                        className="flex size-9 items-center justify-center rounded-lg text-[#6f6658] transition hover:bg-[#f3eadc] hover:text-[#171510] focus:outline-none focus:ring-2 focus:ring-[#2f6f63]/25"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        aria-label={`Delete ${habit.name}`}
                        className="flex size-9 items-center justify-center rounded-lg text-[#9b3d34] transition hover:bg-[#f7e4df] focus:outline-none focus:ring-2 focus:ring-[#9b3d34]/20"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {habits.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#cfc5b6] bg-[#fffdf8] p-8 text-center">
              <p className="text-lg font-semibold">No habits yet</p>
              <p className="mt-2 text-sm text-[#6f6658]">
                Add one habit above and give yourself an easy win today.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ded6c9] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[#2f6f63]">{icon}</div>
      <p className="mt-3 text-sm font-medium text-[#6f6658]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
