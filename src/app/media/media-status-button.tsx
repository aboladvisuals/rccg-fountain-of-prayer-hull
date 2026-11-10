"use client";

import { useState, useTransition } from "react";

type Props = {
  action: () => Promise<{ ok: boolean; message: string }>;
  label: string;
  className: string;
  hint?: string;
};

export default function MediaStatusButton({
  action,
  label,
  className,
  hint,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  function run() {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setOk(result.ok);
      setMessage(result.message);
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={run}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {hint && (
          <span className="text-sm text-inherit opacity-80">{hint}</span>
        )}
        <span className="mt-2 block text-lg font-semibold">
          {pending ? "Sending..." : label}
        </span>
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
    </div>
  );
}
