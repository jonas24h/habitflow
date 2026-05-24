"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  LockKeyhole,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileOnboarding } from "@/components/onboarding/profile-onboarding";
import {
  createProfile,
  fetchProfile,
  updateProfile,
  type Profile,
} from "@/lib/profile-service";
import { supabase } from "@/lib/supabase";

const QUICK_EASE = [0.2, 0.8, 0.2, 1] as const;
const MotionLink = motion.create(Link);
const ACCOUNT_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatAccountDate(value?: string) {
  if (!value) return "Unknown";

  return ACCOUNT_DATE_FORMATTER.format(new Date(value));
}

export default function AccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        router.replace("/auth");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      setCreatedAt(session.user.created_at ?? "");

      try {
        const profile = await fetchProfile(session.user.id);

        if (cancelled) return;

        if (profile) {
          setUsername(profile.username);
          setUsernameInput(profile.username);
          setNeedsOnboarding(false);
        } else {
          setUsername("");
          setUsernameInput("");
          setNeedsOnboarding(true);
        }

        setErrorMessage("");
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setErrorMessage("Could not load profile from Supabase.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/auth");
        return;
      }

      setEmail(session.user.email ?? "");
    });

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  function completeOnboarding(profile: Profile) {
    setUsername(profile.username);
    setUsernameInput(profile.username);
    setNeedsOnboarding(false);
    setErrorMessage("");
  }

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;

    const nextUsername = usernameInput.trim();

    if (!nextUsername) {
      setErrorMessage("Username cannot be empty.");
      setProfileStatus("");
      return;
    }

    setIsSavingProfile(true);
    setErrorMessage("");
    setProfileStatus("");

    try {
      const profile = username
        ? await updateProfile(userId, nextUsername)
        : await createProfile(userId, nextUsername);

      setUsername(profile.username);
      setUsernameInput(profile.username);
      setNeedsOnboarding(false);
      setProfileStatus("Username saved.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not save username.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setPasswordStatus("");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setPasswordStatus("");
      return;
    }

    setIsUpdatingPassword(true);
    setErrorMessage("");
    setPasswordStatus("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsUpdatingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordStatus("Password updated.");
    setIsUpdatingPassword(false);
  }

  async function signOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <main className="min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      {needsOnboarding && userId && (
        <ProfileOnboarding userId={userId} onComplete={completeOnboarding} />
      )}
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />
        <section className="relative flex min-h-dvh flex-col px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5">
          <header className="-mx-5 px-5 pb-5 pt-3">
            <MotionLink
              href="/"
              className="inline-flex touch-manipulation items-center gap-1.5 text-[13px] font-semibold text-[#8c9686] transition-transform duration-150"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12, ease: QUICK_EASE }}
            >
              <ArrowLeft size={15} />
              Today
            </MotionLink>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8c9686]">
                  <UserRound size={15} />
                  Account
                </p>
                <h1 className="mt-2 truncate text-[40px] font-black leading-none tracking-[-0.05em] text-white">
                  {isLoading ? "Profile" : username || "Profile"}
                </h1>
              </div>

              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.08] text-[#d8ff69] shadow-[0_8px_20px_rgba(190,255,79,0.10)] backdrop-blur-md">
                <UserRound size={21} />
              </div>
            </div>
          </header>

          <section className="flex flex-1 flex-col gap-4">
            {errorMessage && (
              <div className="rounded-[26px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
                {errorMessage}
              </div>
            )}

            <section className="rounded-[34px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#c6ff3d]/15 text-[#d8ff69] ring-1 ring-[#c6ff3d]/20">
                  <AtSign size={19} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#8c9686]">
                    Email address
                  </p>
                  <p className="truncate text-[15px] font-bold text-white">
                    {email || "Loading..."}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/[0.07] text-[#8c9686]">
                  <CalendarDays size={19} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#8c9686]">
                    Member since
                  </p>
                  <p className="text-[15px] font-bold text-white">
                    {formatAccountDate(createdAt)}
                  </p>
                </div>
              </div>
            </section>

            <form
              onSubmit={saveUsername}
              className="rounded-[34px] border border-white/10 bg-white/[0.08] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            >
              <div className="px-1 pb-3">
                <h2 className="text-[22px] font-black tracking-[-0.035em] text-white">
                  Profile
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#8c9686]">
                  Edit your username.
                </p>
              </div>

              <label className="flex h-[56px] items-center gap-3 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[#8c9686] focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
                <UserRound size={18} />
                <input
                  id="account-username"
                  name="username"
                  type="text"
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  placeholder="Username"
                  autoComplete="nickname"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
                />
              </label>

              {profileStatus && (
                <div className="mt-3 rounded-[22px] border border-[#c6ff3d]/20 bg-[#c6ff3d]/10 px-4 py-3 text-sm font-semibold text-[#d8ff69]">
                  {profileStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isSavingProfile}
                className="mt-3 flex h-[54px] w-full touch-manipulation items-center justify-center rounded-[23px] bg-[#c6ff3d] text-[15px] font-black text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.30)] transition active:scale-95 disabled:opacity-60"
              >
                {isSavingProfile ? "Saving..." : "Save username"}
              </button>
            </form>

            <form
              onSubmit={changePassword}
              className="rounded-[34px] border border-white/10 bg-white/[0.08] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            >
              <div className="px-1 pb-3">
                <h2 className="text-[22px] font-black tracking-[-0.035em] text-white">
                  Password
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#8c9686]">
                  Change your password for this session.
                </p>
              </div>

              <label className="flex h-[56px] items-center gap-3 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[#8c9686] focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
                <LockKeyhole size={18} />
                <input
                  id="account-new-password"
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
                />
              </label>

              <label className="mt-2 flex h-[56px] items-center gap-3 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[#8c9686] focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
                <LockKeyhole size={18} />
                <input
                  id="account-confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
                />
              </label>

              {passwordStatus && (
                <div className="mt-3 rounded-[22px] border border-[#c6ff3d]/20 bg-[#c6ff3d]/10 px-4 py-3 text-sm font-semibold text-[#d8ff69]">
                  {passwordStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isUpdatingPassword}
                className="mt-3 flex h-[54px] w-full touch-manipulation items-center justify-center rounded-[23px] border border-white/10 bg-white/[0.07] text-[15px] font-black text-[#d8ff69] transition active:scale-95 disabled:opacity-60"
              >
                {isUpdatingPassword ? "Updating..." : "Update password"}
              </button>
            </form>

            <button
              type="button"
              onClick={signOut}
              disabled={isSigningOut}
              className="flex h-[54px] w-full touch-manipulation items-center justify-center gap-2 rounded-[23px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 text-[15px] font-black text-[#ffb3b3] transition active:scale-95 disabled:opacity-60"
            >
              <LogOut size={18} />
              {isSigningOut ? "Logging out..." : "Logout"}
            </button>
          </section>

          <BottomNav />
        </section>
      </div>
    </main>
  );
}
