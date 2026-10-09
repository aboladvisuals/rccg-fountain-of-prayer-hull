"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { magicLinkCallback } from "@/lib/auth/redirects";

export default function LoginForm({ next, authError, signedOut }: {
  next: string; authError: boolean; signedOut: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState(authError
    ? "That login link could not be verified. It may have expired, already been used, or opened in a different browser. Request a new link here."
    : signedOut ? "You have been signed out on this device." : "");
  const busy = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || status === "sent") return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    busy.current = true;
    setStatus("sending");
    setMessage("");
    try {
      const { error } = await createClient().auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: magicLinkCallback(window.location.origin, next) },
      });
      if (error) {
        setStatus("error");
        setMessage(error.status === 429 || error.code === "over_email_send_rate_limit"
          ? "Too many login emails have been requested. Please wait before trying again. If this continues, contact the church team."
          : "We couldn’t send your login link. Please try again shortly or contact the church team.");
        return;
      }
      setStatus("sent");
      setMessage("Check your inbox and spam folder. Open the newest link in this same browser and on this same device to finish signing in.");
    } catch {
      setStatus("error");
      setMessage("We couldn’t reach the login service. Check your connection and try again.");
    } finally { busy.current = false; }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-purple-700">← Back to home</Link>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Member Access</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
          <p className="mt-3 text-slate-600">Enter your email address and we’ll send you a secure login link.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-busy={status === "sending"}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
                value={email} disabled={status === "sending" || status === "sent"}
                onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600 disabled:bg-slate-50" />
            </div>
            <button type="submit" disabled={status === "sending" || status === "sent"}
              className="w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-700 disabled:opacity-60">
              {status === "sending" ? "Sending…" : status === "sent" ? "Login link requested" : "Send me a login link"}
            </button>
          </form>
          {message && <p role={status === "error" || authError ? "alert" : "status"} className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">{message}</p>}
          {status === "sent" && <button type="button" onClick={() => { setStatus("idle"); setMessage(""); }} className="mt-4 text-sm font-medium text-purple-700">Use another email or request a new link</button>}
          <p className="mt-6 text-xs leading-5 text-slate-500">Signing in does not automatically grant church membership. The church team manages member access.</p>
        </div>
      </div>
    </main>
  );
}
