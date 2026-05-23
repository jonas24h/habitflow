"use client";

import { supabase } from "@/lib/supabase";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        router.replace("/");
        return;
      }

      setIsLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

      if (session) {
        router.replace("/");
      }
    });

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn();
  }

  async function signIn() {
    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
  }

  async function createAccount() {
    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    setStatusMessage("Account created. Check your email to confirm it.");
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-dvh bg-[#030504] font-sans text-[#f4f7f1]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,rgba(190,255,79,0.20),transparent_34%),linear-gradient(180deg,#111610_0%,#050706_42%,#020302_100%)] px-5 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_85%_10%,rgba(190,255,79,0.18),transparent_32%)]" />

        <section className="relative">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-[#c6ff3d] text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.28)]">
              <Sparkles size={24} />
            </div>
            <p className="mt-6 text-[15px] font-semibold text-[#8c9686]">
              HabitFlow
            </p>
            <h1 className="mt-2 text-[46px] font-black leading-none tracking-[-0.06em] text-white">
              Welcome back
            </h1>
            <p className="mt-4 max-w-[300px] text-[15px] font-medium leading-6 text-[#8c9686]">
              Sign in to sync your habits with Supabase.
            </p>
          </div>

          <form
            onSubmit={login}
            method="post"
            action="#"
            noValidate
            className="rounded-[34px] border border-white/10 bg-white/[0.08] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          >
            <label className="flex h-[56px] items-center gap-3 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[#8c9686] focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
              <Mail size={18} />
              <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
              />
            </label>

            <label className="mt-2 flex h-[56px] items-center gap-3 rounded-[23px] border border-white/10 bg-black/25 px-4 text-[#8c9686] focus-within:border-[#c6ff3d]/35 focus-within:bg-black/35">
              <LockKeyhole size={18} />
              <input
                id="auth-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#667061]"
              />
            </label>

            {errorMessage && (
              <div className="mt-3 rounded-[22px] border border-[#ff6b6b]/20 bg-[#ff6b6b]/10 px-4 py-3 text-sm font-semibold text-[#ffb3b3]">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div className="mt-3 rounded-[22px] border border-[#c6ff3d]/20 bg-[#c6ff3d]/10 px-4 py-3 text-sm font-semibold text-[#d8ff69]">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="mt-3 flex h-[54px] w-full items-center justify-center rounded-[23px] bg-[#c6ff3d] text-[15px] font-black text-[#081006] shadow-[0_14px_34px_rgba(198,255,61,0.30)] transition active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? "Please wait..." : "Login"}
            </button>

            <button
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={createAccount}
              className="mt-2 flex h-[50px] w-full items-center justify-center rounded-[21px] border border-white/10 bg-white/[0.07] text-[15px] font-bold text-[#d8ff69] transition active:scale-95 disabled:opacity-60"
            >
              Create account
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
