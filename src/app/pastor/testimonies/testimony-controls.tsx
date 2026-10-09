"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveTestimony,
  setTestimonyPublic,
} from "./actions";

type Props = {
  testimonyId: string;
  approved: boolean;
  isPublic: boolean;
};

export default function TestimonyControls({
  testimonyId,
  approved,
  isPublic,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function approve() {
    setMessage("");

    startTransition(async () => {
      const result = await approveTestimony(testimonyId);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function togglePublic() {
    setMessage("");

    startTransition(async () => {
      const result = await setTestimonyPublic(
        testimonyId,
        !isPublic
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
        {!approved && (
          <button
            type="button"
            disabled={pending}
            onClick={approve}
            className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Updating..." : "Approve testimony"}
          </button>
        )}

        {approved && (
          <button
            type="button"
            disabled={pending}
            onClick={togglePublic}
            className={
              isPublic
                ? "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                : "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            }
          >
            {pending
              ? "Updating..."
              : isPublic
              ? "Remove from public display"
              : "Make public"}
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
