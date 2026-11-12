"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

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
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      intro={<p>Enter your email address and we’ll send you a secure password reset link.</p>}
      back={{ href: "/login", label: "Back to login" }}
    >
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-busy={status === "sending"}
          >
            <div>
              <label
                htmlFor="email"
                className="field-label"
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
                className="field"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="btn btn-solid btn-primary w-full"
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
              className={`notice mt-5 ${status === "error" ? "notice-error" : "notice-success"}`}
            >
              {message}
            </p>
          )}
    </AuthShell>
  );
}
