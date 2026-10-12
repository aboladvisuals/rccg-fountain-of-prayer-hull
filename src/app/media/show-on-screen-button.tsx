"use client";

import { useState, useTransition } from "react";
import { showManualSlide } from "./actions";

type Props = {
  slideType:
    | "welcome"
    | "announcement"
    | "testimony"
    | "birthday"
    | "presence"
    | "serving"
    | "verse"
    | "lyrics";
  title: string;
  content?: string;
  payload?: Record<string, unknown>;
};

export default function ShowOnScreenButton({
  slideType,
  title,
  content,
  payload,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function show() {
    setMessage("");

    startTransition(async () => {
      const result = await showManualSlide({
        slideType,
        title,
        content,
        payload,
      });

      setMessage(result.message);
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        onClick={show}
        className="rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : "Show on Screen"}
      </button>

      {message && (
        <p className="mt-2 text-xs font-medium text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}