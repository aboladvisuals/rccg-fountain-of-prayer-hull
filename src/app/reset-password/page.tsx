"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_RULE =
  /^(?=.{8,128}$)(?=[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "checking" | "ready" | "updating" | "success" | "error"
  >("checking");
  const [message, setMessage] = useState("Verifying your recovery session...");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setStatus("error");
        setMessage(
          "This password reset session is missing or has expired. Request a new reset link."
        );
        return;
      }

      setStatus("ready");
      setMessage("");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!PASSWORD_RULE.test(password)) {
      setStatus("error");
      setMessage(
        "Password must be 8–128 characters, start with an uppercase letter, and include a lowercase letter, number and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("The password and confirmation do not match.");
      return;
    }

    setStatus("updating");

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();

    setPassword("");
    setConfirmPassword("");
    setStatus("success");
    setMessage(
      "Your password has been reset successfully. You can now sign in with your new password."
    );
  }

  const formDisabled =
    status === "checking" || status === "updating" || status === "success";

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

          <h1 className="mt-2 text-3xl font-bold">Reset your password</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a new secure password for your account.
          </p>

          {status !== "success" && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  New password
                </label>

                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={formDisabled}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600 disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={formDisabled}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={formDisabled}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600 disabled:bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={formDisabled}
                className="w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {status === "updating"
                  ? "Updating password..."
                  : "Reset password"}
              </button>
            </form>
          )}

          {message && (
            <p
              role={status === "error" ? "alert" : "status"}
              className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-700"
            >
              {message}
            </p>
          )}

          {status === "success" && (
            <Link
              href="/login"
              className="mt-5 inline-block text-sm font-semibold text-purple-700"
            >
              Continue to login →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}