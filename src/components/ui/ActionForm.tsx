"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

export type ActionResult = { ok: boolean; message: string };

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
};

/**
 * Form wrapper for server actions that return { ok, message }.
 * Shows pending state and an accessible success / error message.
 * Authorisation stays inside the server action; this is presentation only.
 */
export default function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  className,
  buttonClassName,
  resetOnSuccess = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      try {
        const next = await action(formData);
        setResult(next);
        if (next.ok && resetOnSuccess) form.current?.reset();
      } catch {
        setResult({ ok: false, message: "Something went wrong. Please try again." });
      }
    });
  }

  return (
    <form ref={form} action={onSubmit} className={className} aria-busy={pending}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className={
          buttonClassName ??
          "btn-primary rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={
            result.ok
              ? "basis-full rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800 sm:col-span-2"
              : "basis-full rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2"
          }
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
