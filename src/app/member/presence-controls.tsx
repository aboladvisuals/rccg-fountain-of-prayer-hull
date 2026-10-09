"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn, setServing } from "./presence-actions";

type Props = {
  serviceId: string;
  checkedIn: boolean;
  serving: boolean;
  unavailable: boolean;
};

export default function PresenceControls({
  serviceId,
  checkedIn,
  serving,
  unavailable,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage("");

    startTransition(async () => {
      const result = await action();

      setSuccess(result.ok);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  if (unavailable) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      {!checkedIn ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => checkIn(serviceId))}
            className="rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Please wait..." : "I’m here today"}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setServing(serviceId, true))}
            className="rounded-xl border border-purple-300 bg-white px-5 py-3 font-semibold text-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            I’m serving today
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => setServing(serviceId, !serving))
          }
          className={
            serving
              ? "rounded-xl border border-green-300 bg-green-50 px-5 py-3 font-semibold text-green-800 disabled:opacity-60"
              : "rounded-xl border border-purple-300 bg-white px-5 py-3 font-semibold text-purple-800 disabled:opacity-60"
          }
        >
          {pending
            ? "Updating..."
            : serving
              ? "✓ Serving today — tap to undo"
              : "I’m serving today"}
        </button>
      )}

      {message && (
        <p
          role="status"
          className={
            success
              ? "mt-3 text-sm font-medium text-green-700"
              : "mt-3 text-sm font-medium text-red-700"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
