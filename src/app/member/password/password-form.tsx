"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_RULE =
  /^(?=.{8,128}$)(?=[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/;

export default function PasswordForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!PASSWORD_RULE.test(password)) {
      setStatus({
        type: "error",
        message:
          "Password must be 8–128 characters, start with an uppercase letter, and include a lowercase letter, number and special character.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "The password and confirmation do not match.",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (error) {
      setStatus({
        type: "error",
        message: error.message,
      });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setStatus({
      type: "success",
      message: "Your password has been updated successfully.",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-800"
        >
          New password
        </label>

        <div className="mt-2 flex gap-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Minimum 8 characters. Start with an uppercase letter and include at
          least one lowercase letter, number and special character.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-slate-800"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          required
        />
      </div>

      {status ? (
        <div
          role="status"
          className={
            status.type === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Updating password..." : "Set or change password"}
      </button>
    </form>
  );
}