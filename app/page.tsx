
"use client";

import { useState, type FormEvent } from "react";
import { loginUser, registerUser } from "@/lib/auth";
import {
  getUserBusinessProfile,
  activateUserBusinessProfile,
} from "@/lib/business-profile";

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function changeMode(next: "login" | "register") {
    setMode(next);
    setMessage("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      if (isRegister) {
        const name = String(form.get("name") || "").trim();
        const confirmPassword = String(
          form.get("confirmPassword") || ""
        );

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await registerUser(name, email, password);

        setMessage("Account created successfully! Please sign in.");
        setMode("login");
        formElement.reset();
        return;
      }

      const user = await loginUser(email, password);
      const profile = getUserBusinessProfile(user.id);

      if (profile) {
        activateUserBusinessProfile(profile);
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/select-business";
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] bg-white overflow-x-hidden">

      {/* LEFT BRANDING SECTION */}
      <section className="relative min-w-0 min-h-[230px] sm:min-h-[270px] lg:min-h-dvh overflow-hidden bg-gradient-to-br from-[#1746a2] via-[#1769d2] to-[#00a6c7] px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-9 flex flex-col justify-between text-white">

        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full border border-white/15 pointer-events-none" />
        <div className="absolute -top-16 -right-8 w-64 h-64 rounded-full border border-white/15 pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-blue-700 flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shrink-0">
              O
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                OneBiz
              </h1>
              <p className="text-[8px] sm:text-[9px] tracking-[3px] text-blue-100 uppercase">
                Business Suite
              </p>
            </div>
          </div>

          {/* HERO CONTENT */}
          <div className="mt-7 sm:mt-9 lg:mt-16 max-w-xl">

            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold">
              <span className="w-2 h-2 bg-emerald-300 rounded-full shrink-0" />
              ONE PLATFORM. EVERY BUSINESS.
            </span>

            <h2 className="text-[27px] sm:text-4xl xl:text-[42px] font-extrabold leading-[1.2] mt-4 sm:mt-6">
              Manage smarter.
              <br />
              Grow faster.
              <br />
              <span className="text-cyan-200">
                All with OneBiz.
              </span>
            </h2>

            <p className="text-blue-50/90 text-xs sm:text-sm leading-6 sm:leading-7 mt-3 sm:mt-5 max-w-md">
              A smarter way to manage your sales, orders, inventory,
              customers and everyday business operations.
            </p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="relative z-10 mt-7 sm:mt-9 lg:mt-10">

          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-lg">

            <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl p-3 sm:p-3.5">
              <div className="text-lg sm:text-xl mb-1 sm:mb-2">
                📊
              </div>

              <p className="font-bold text-[11px] sm:text-sm">
                Smart Dashboard
              </p>

              <p className="text-[9px] sm:text-xs text-blue-100 mt-1">
                Business at a glance
              </p>
            </div>

            <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-xl p-3 sm:p-3.5">
              <div className="text-lg sm:text-xl mb-1 sm:mb-2">
                ⚡
              </div>

              <p className="font-bold text-[11px] sm:text-sm">
                Easy Operations
              </p>

              <p className="text-[9px] sm:text-xs text-blue-100 mt-1">
                Everything in one place
              </p>
            </div>

          </div>

          <p className="text-[9px] sm:text-[10px] text-blue-100/70 mt-4 sm:mt-6">
            © 2026 OneBiz. All rights reserved.
          </p>
        </div>
      </section>

      {/* RIGHT LOGIN SECTION */}
      <section className="min-w-0 min-h-[calc(100dvh-230px)] sm:min-h-[calc(100dvh-270px)] lg:min-h-dvh bg-[#f7faff] flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-16">

        <div className="w-full max-w-[420px] min-w-0">

          {/* HEADING */}
          <div className="mb-5 sm:mb-6">

            <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 mb-4 sm:mb-5" />

            <p className="text-[10px] sm:text-xs font-extrabold tracking-[2px] text-blue-600 mb-2">
              {isRegister ? "GET STARTED WITH ONEBIZ" : "WELCOME BACK"}
            </p>

            <h2 className="text-[26px] sm:text-3xl font-extrabold text-[#14213d] tracking-tight">
              {isRegister ? "Create your account" : "Welcome back!"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-6">
              {isRegister
                ? "Create your account and start managing your business."
                : "Sign in to continue to your business workspace."}
            </p>
          </div>

          {/* LOGIN / REGISTER TABS */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#eaf0fa] rounded-xl mb-5 sm:mb-6">

            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                !isRegister
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 hover:text-blue-700"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => changeMode("register")}
              className={`h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                isRegister
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 hover:text-blue-700"
              }`}
            >
              Register
            </button>

          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">

            {isRegister && (
              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-[#26344d] mb-1.5">
                  Full Name
                </label>

                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full min-w-0 h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-[#26344d] mb-1.5">
                Email Address
              </label>

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full min-w-0 h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-[#26344d] mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder="Enter your password"
                  className="w-full min-w-0 h-11 sm:h-12 px-3 sm:px-4 pr-16 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-extrabold text-blue-600 hover:text-cyan-600"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-[#26344d] mb-1.5">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    className="w-full min-w-0 h-11 sm:h-12 px-3 sm:px-4 pr-16 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-extrabold text-blue-600 hover:text-cyan-600"
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            )}

            {!isRegister ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm pt-1">

                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    name="remember"
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      "Password recovery is not available in local mode."
                    )
                  }
                  className="font-bold text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>

              </div>
            ) : (
              <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-500 pt-1">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 accent-blue-600 shrink-0"
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:from-blue-800 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-200 transition-all sm:hover:-translate-y-0.5"
            >
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create My Account"
                  : "Sign In to OneBiz"}

              {!loading && <span className="ml-2">→</span>}
            </button>

            {message && (
              <p
                role="status"
                className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 break-words"
              >
                {message}
              </p>
            )}

          </form>

          {/* FOOTER */}
          <div className="flex items-center gap-3 my-5 sm:my-6">
            <div className="h-px bg-slate-200 flex-1" />

            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 whitespace-nowrap">
              ONEBIZ BUSINESS SUITE
            </span>

            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "New to OneBiz?"}

            <button
              type="button"
              onClick={() => changeMode(isRegister ? "login" : "register")}
              className="ml-1.5 font-extrabold text-blue-600 hover:text-cyan-600"
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </p>

        </div>
      </section>
    </main>
  );
}
