import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  username: string;
};

type ProfileRow = {
  id: string;
  username: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
  };
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProfile(data) : null;
}

export async function createProfile(userId: string, username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      username,
    })
    .select("id,username")
    .single();

  if (error) {
    throw error;
  }

  return toProfile(data);
}

export async function updateProfile(userId: string, username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", userId)
    .select("id,username")
    .single();

  if (error) {
    throw error;
  }

  return toProfile(data);
}
