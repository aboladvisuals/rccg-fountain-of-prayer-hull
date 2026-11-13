"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

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
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      intro={<p>Choose a new secure password for your account.</p>}
      back={{ href: "/login", label: "Back to login" }}
    >
          {status !== "success" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="field-label"
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
                    className="field min-w-0 flex-1"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={formDisabled}
                    className="btn btn-secondary min-w-20 border border-slate-300 bg-white text-sm text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="field-label"
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
                  className="field"
                />
              </div>

              <button
                type="submit"
                disabled={formDisabled}
                className="btn btn-solid btn-primary w-full"
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
              className={`notice mt-5 ${status === "error" ? "notice-error" : status === "success" ? "notice-success" : ""}`}
            >
              {message}
            </p>
          )}

          {status === "success" && (
            <Link
              href="/login"
              className="btn btn-solid btn-primary mt-5 w-full no-underline"
            >
              Continue to login →
            </Link>
          )}
    </AuthShell>
  );
}
