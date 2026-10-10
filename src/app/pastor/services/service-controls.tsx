"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setServiceStatus } from "./actions";

type Props = {
  serviceId: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
};

export default function ServiceControls({
  serviceId,
  status,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function changeStatus(
    nextStatus:
      | "scheduled"
      | "live"
      | "completed"
      | "cancelled"
  ) {
    setMessage("");

    startTransition(async () => {
      const result = await setServiceStatus(
        serviceId,
        nextStatus
      );

      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">

        {status !== "live" &&
          status !== "completed" &&
          status !== "cancelled" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => changeStatus("live")}
              className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Go live
            </button>
          )}

        {status === "live" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              changeStatus("completed")
            }
            className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Complete service
          </button>
        )}

        {status === "scheduled" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              changeStatus("cancelled")
            }
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            Cancel
          </button>
        )}

      </div>

      {message && (
        <p className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}
