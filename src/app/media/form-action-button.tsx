"use client";

import { useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
  label: string;
  className?: string;
  children?: React.ReactNode;
};

export default function FormActionButton({
  action,
  label,
  className,
  children,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  function onSubmit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await action(formData);
      setOk(result.ok);
      setMessage(result.message);
    });
  }

  return (
    <form action={onSubmit}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className={
          className ??
          "mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {pending ? "Sending..." : label}
      </button>
      {message && (
        <p
          className={
            ok
              ? "mt-2 text-xs font-medium text-green-700"
              : "mt-2 text-xs font-medium text-red-700"
          }
          role={ok ? "status" : "alert"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
