"use client";

import { createProfile, type Profile } from "@/lib/profile-service";
import { Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

type ProfileOnboardingProps = {
  userId: string;
  onComplete: (profile: Profile) => void;
};

export function ProfileOnboarding({
  userId,
  onComplete,
}: ProfileOnboardingProps) {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedUsername = username.trim();

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedUsername) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const profile = await createProfile(userId, trimmedUsername);
      onComplete(profile);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not save your profile.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="fixed inset-0 z-50 min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] px-5 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />

        <section className="relative">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-[#c6ff3d] text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.28)]">
              <Sparkles size={24} />
            </div>
            <h1 className="mt-6 text-[46px] font-black leading-none tracking-[-0.06em] text-white">
              Welcome to HabitFlow
            </h1>
            <p className="mt-4 text-[15px] font-medium leading-6 text-[#8c9686]">
              Choose your name
            </p>
          </div>

          <form
            onSubmit={submitName}
            method="post"
            action="#"
            noValidate
            className="rounded-[34px] border border-white/10 bg-white/[0.08] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <label className="flex h-[56px] items-center rounded-[23px] border border-white/10 bg-black/25 px-4 focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
              <input
                id="profile-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
              />
            </label>

            {errorMessage && (
              <div className="mt-3 rounded-[22px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!trimmedUsername || isSubmitting}
              className="mt-3 flex h-[54px] w-full items-center justify-center rounded-[23px] bg-[#c6ff3d] text-[15px] font-black text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.30)] transition active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? "Please wait..." : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
