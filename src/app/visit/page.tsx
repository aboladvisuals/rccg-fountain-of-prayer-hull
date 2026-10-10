"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { registerVisit, type VisitResult } from "./actions";
import PublicShell from "@/components/public/PublicShell";
import s from "@/components/public/public.module.css";

export default function VisitPage() {
  const [result, setResult] = useState<VisitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const saved = result?.status === "success";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || saved) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = formData.get("firstName");
    if (typeof firstName !== "string" || !firstName.trim()) {
      setResult({
        status: "error",
        field: "firstName",
        message: "Please enter your first name.",
      });
      (form.elements.namedItem("firstName") as HTMLInputElement)?.focus();
      return;
    }
    submitting.current = true;
    setResult(null);
    startTransition(async () => {
      try {
        const nextResult = await registerVisit(formData);
        setResult(nextResult);
        if (nextResult.field) {
          (
            form.elements.namedItem(nextResult.field) as HTMLInputElement
          )?.focus();
        }
      } catch {
        setResult({
          status: "error",
          message:
            "We couldn’t confirm your visit was saved. Please check with the welcome team before submitting again.",
        });
      } finally {
        submitting.current = false;
      }
    });
  }

  return (
    <PublicShell>
      <section className={s.checkinSection}>
        <div className="mx-auto max-w-xl">
          <Link href="/" className="text-sm font-medium text-purple-700">
            ← Back to home
          </Link>

          <div className={s.checkinPanel}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              First Time Here?
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              We’re glad you came
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              No account is required. Let us know you’re with us today.
            </p>

            <form
              onSubmit={handleSubmit}
              aria-busy={pending}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  First name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  maxLength={100}
                  disabled={pending || saved}
                  aria-invalid={result?.field === "firstName"}
                  aria-describedby={
                    result?.field === "firstName" ? "visit-message" : undefined
                  }
                  type="text"
                  required
                  placeholder="Sarah"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  maxLength={100}
                  disabled={pending || saved}
                  aria-invalid={result?.field === "lastName"}
                  aria-describedby={
                    result?.field === "lastName" ? "visit-message" : undefined
                  }
                  type="text"
                  placeholder="Thompson"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="wantsContact"
                  disabled={pending || saved}
                  className="mt-1 h-4 w-4"
                />
                <span>I’d like someone from the church to contact me.</span>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="showNameOnDisplay"
                  disabled={pending || saved}
                  defaultChecked
                  className="mt-1 h-4 w-4"
                />
                <span>
                  It’s okay to show my first name on the church welcome screen
                  today.
                </span>
              </label>

              <button
                type="submit"
                disabled={pending || saved}
                className="w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending
                  ? "Saving your visit…"
                  : saved
                    ? "Visit recorded"
                    : "I’m here today"}
              </button>
              {result && (
                <p
                  id="visit-message"
                  role={result.status === "error" ? "alert" : "status"}
                  className={
                    result.status === "error"
                      ? "text-sm text-red-700"
                      : "text-sm text-green-700"
                  }
                >
                  {result.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
