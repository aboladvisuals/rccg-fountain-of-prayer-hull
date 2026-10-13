"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const address = email.trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
      address.length > 254
    ) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const supabase = createClient();

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo,
      });

      if (error) {
        setStatus("error");
        setMessage(
          error.status === 429
            ? "Too many password reset requests. Please wait before trying again."
            : "We couldn’t send the password reset email. Please try again shortly."
        );
        return;
      }

      setStatus("sent");
      setMessage(
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder."
      );
    } catch {
      setStatus("error");
      setMessage(
        "We couldn’t reach the login service. Check your connection and try again."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="text-sm font-medium text-purple-700"
        >
          ← Back to login
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Account recovery
          </p>

          <h1 className="mt-2 text-3xl font-bold">Forgot your password?</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your email address and we’ll send you a secure password reset
            link.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            aria-busy={status === "sending"}
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                disabled={status === "sending" || status === "sent"}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600 disabled:bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending..."
                : status === "sent"
                  ? "Reset email sent"
                  : "Send password reset link"}
            </button>
          </form>

          {message && (
            <p
              role={status === "error" ? "alert" : "status"}
              className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-700"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}