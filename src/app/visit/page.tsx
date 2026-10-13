"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import PublicShell from "@/components/public/PublicShell";
import s from "@/components/public/public.module.css";

import {
  registerVisit,
  type VisitResult,
} from "./actions";

export default function VisitPage() {
  const [result, setResult] =
    useState<VisitResult | null>(null);

  const [pending, startTransition] =
    useTransition();

  const submitting = useRef(false);

  const saved =
    result?.status === "success";

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting.current || saved) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const firstName =
      formData.get("firstName");

    if (
      typeof firstName !== "string" ||
      !firstName.trim()
    ) {
      setResult({
        status: "error",
        field: "firstName",
        message:
          "Please enter your first name.",
      });

      (
        form.elements.namedItem(
          "firstName"
        ) as HTMLInputElement
      )?.focus();

      return;
    }

    submitting.current = true;
    setResult(null);

    startTransition(async () => {
      try {
        const nextResult =
          await registerVisit(formData);

        setResult(nextResult);

        if (nextResult.field) {
          (
            form.elements.namedItem(
              nextResult.field
            ) as HTMLInputElement
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
          <Link
            href="/plan-your-visit"
            className="text-sm font-medium text-purple-700"
          >
            ← First-visit information
          </Link>

          <div className={s.checkinPanel}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              WELCOME TO FOUNTAIN OF PRAYER
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              We’re glad you’re here.
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              If you are visiting with us today,
              simply let the welcome team know
              you’ve arrived. No member account
              is required.
            </p>

            <div className="mt-6 rounded-2xl bg-purple-50 p-4 text-sm leading-6 text-purple-950">
              <strong>Just your name is enough.</strong>{" "}
              The additional options below are entirely
              your choice.
            </div>

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
                  aria-invalid={
                    result?.field === "firstName"
                  }
                  aria-describedby={
                    result?.field === "firstName"
                      ? "visit-message"
                      : undefined
                  }
                  type="text"
                  required
                  placeholder="Sarah"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Last name{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  maxLength={100}
                  disabled={pending || saved}
                  aria-invalid={
                    result?.field === "lastName"
                  }
                  aria-describedby={
                    result?.field === "lastName"
                      ? "visit-message"
                      : undefined
                  }
                  type="text"
                  placeholder="Thompson"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50"
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Optional
                </p>

                <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    name="wantsContact"
                    disabled={pending || saved}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    I’d like someone from the church
                    to contact me.
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    name="showNameOnDisplay"
                    disabled={pending || saved}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    It’s okay to show my first name
                    on the church welcome screen today.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={pending || saved}
                className="w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                  role={
                    result.status === "error"
                      ? "alert"
                      : "status"
                  }
                  className={
                    result.status === "error"
                      ? "rounded-xl bg-red-50 p-4 text-sm text-red-700"
                      : "rounded-xl bg-green-50 p-4 text-sm text-green-800"
                  }
                >
                  {result.message}
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Your visitor check-in is used only for
              today’s church welcome and follow-up
              choices.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}