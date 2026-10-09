"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAnnouncementActive } from "./actions";

type Props = {
  announcementId: string;
  active: boolean;
};

export default function AnnouncementToggle({
  announcementId,
  active,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function toggle() {
    setMessage("");

    startTransition(async () => {
      const result = await setAnnouncementActive(
        announcementId,
        !active
      );

      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={
          active
            ? "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            : "rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        }
      >
        {pending
          ? "Updating..."
          : active
          ? "Hide from display"
          : "Activate"}
      </button>

      {message && (
        <p className="mt-2 text-xs text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}
