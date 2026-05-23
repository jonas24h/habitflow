import type { HabitSchedule } from "@/types/habit";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      habit_logs: {
        Row: {
          completed_at: string;
          date: string;
          habit_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          date: string;
          habit_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          date?: string;
          habit_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          schedule: HabitSchedule;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          name: string;
          schedule: HabitSchedule;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          schedule?: HabitSchedule;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string | null;
          id: string;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          username: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
