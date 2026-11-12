"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { magicLinkCallback } from "@/lib/auth/redirects";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginForm({
  next,
  authError,
  signedOut,
}: {
  next: string;
  authError: boolean;
  signedOut: boolean;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const [message, setMessage] = useState(
    authError
      ? "That login link could not be verified. It may have expired, already been used, or opened in a different browser. Request a new link here."
      : signedOut
      ? "You have been signed out on this device."
      : ""
  );

  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "signing" | "error"
  >("idle");
  const [passwordMessage, setPasswordMessage] = useState("");

  const busy = useRef(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy.current || status === "sent") return;

    const address = email.trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
      address.length > 254
    ) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    busy.current = true;
    setStatus("sending");
    setMessage("");

    try {
      const { error } =
        await createClient().auth.signInWithOtp({
          email: address,
          options: {
            emailRedirectTo: magicLinkCallback(
              window.location.origin,
              next
            ),
          },
        });

      if (error) {
        setStatus("error");

        setMessage(
          error.status === 429 ||
            error.code === "over_email_send_rate_limit"
            ? "Too many login emails have been requested. Please wait before trying again. If this continues, contact the church team."
            : "We couldn’t send your login link. Please try again shortly or contact the church team."
        );

        return;
      }

      setStatus("sent");
      setMessage(
        "Check your inbox and spam folder. Open the newest link in this same browser and on this same device to finish signing in."
      );
    } catch {
      setStatus("error");
      setMessage(
        "We couldn’t reach the login service. Check your connection and try again."
      );
    } finally {
      busy.current = false;
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const address = passwordEmail.trim();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
      address.length > 254
    ) {
      setPasswordStatus("error");
      setPasswordMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (!password) {
      setPasswordStatus("error");
      setPasswordMessage("Please enter your password.");
      return;
    }

    setPasswordStatus("signing");
    setPasswordMessage("");

    try {
      const { error } =
        await createClient().auth.signInWithPassword({
          email: address,
          password,
        });

      if (error) {
        setPasswordStatus("error");

        setPasswordMessage(
          error.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : "We couldn’t sign you in. Please try again."
        );

        return;
      }

      const destination =
        next.startsWith("/member") ? next : "/member";

      router.push(destination);
      router.refresh();
    } catch {
      setPasswordStatus("error");
      setPasswordMessage(
        "We couldn’t reach the login service. Check your connection and try again."
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Member access"
      title="Welcome back"
      intro={<p>Sign in with your password or request a secure login link by email.</p>}
      back={{ href: "/", label: "Church home" }}
      footnote={
        <p>
          Signing in does not automatically grant church membership. The church
          team manages member access.
        </p>
      }
    >
      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-5"
        aria-busy={passwordStatus === "signing"}
      >
        <div>
          <label htmlFor="passwordEmail" className="field-label">
            Email address
          </label>
          <input
            id="passwordEmail"
            name="passwordEmail"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            value={passwordEmail}
            onChange={(event) => setPasswordEmail(event.target.value)}
            placeholder="you@example.com"
            aria-invalid={passwordStatus === "error" ? true : undefined}
            aria-describedby={passwordMessage ? "password-message" : undefined}
            className="field"
          />
        </div>

        <div>
          <div className="mb-[0.45rem] flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="field-label mb-0">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-purple-700 underline-offset-4 hover:text-purple-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordStatus === "error" ? true : undefined}
            aria-describedby={passwordMessage ? "password-message" : undefined}
            className="field"
          />
        </div>

        <button
          type="submit"
          disabled={passwordStatus === "signing"}
          className="btn btn-solid btn-primary w-full"
        >
          {passwordStatus === "signing" ? (
            <>
              <span className="spinner" aria-hidden="true" /> Signing in…
            </>
          ) : (
            "Sign in with password"
          )}
        </button>
      </form>

      {passwordMessage && (
        <p
          id="password-message"
          role="alert"
          className={`notice mt-4 ${passwordStatus === "error" ? "notice-error" : ""}`}
        >
          {passwordMessage}
        </p>
      )}

      <div className="divider my-7">Or use a login link</div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-busy={status === "sending"}
      >
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            value={email}
            disabled={status === "sending" || status === "sent"}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-describedby={message ? "magic-message" : undefined}
            className="field"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="btn btn-outline btn-secondary w-full"
        >
          {status === "sending"
            ? "Sending…"
            : status === "sent"
            ? "Login link requested"
            : "Email me a login link"}
        </button>
      </form>

      {message && (
        <p
          id="magic-message"
          role={status === "error" || authError ? "alert" : "status"}
          className={`notice mt-4 ${
            status === "error" || authError
              ? "notice-error"
              : status === "sent"
              ? "notice-success"
              : ""
          }`}
        >
          {message}
        </p>
      )}

      {status === "sent" && (
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
          className="mt-3 min-h-11 text-sm font-semibold text-purple-700 underline-offset-4 hover:underline"
        >
          Use another email or request a new link
        </button>
      )}
    </AuthShell>
  );
}
