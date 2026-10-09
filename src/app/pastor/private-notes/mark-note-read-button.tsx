"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNoteRead } from "./actions";

type Props = {
  noteId: string;
  isRead: boolean;
};

export default function MarkNoteReadButton({
  noteId,
  isRead,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (isRead) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
        Read
      </span>
    );
  }

  function handleClick() {
    setMessage("");

    startTransition(async () => {
      const result = await markNoteRead(noteId);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Updating..." : "Mark as read"}
      </button>

      {message && (
        <p className="text-xs text-slate-500">{message}</p>
      )}
    </div>
  );
}
