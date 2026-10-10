"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createService } from "./actions";

export default function ServiceForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createService(formData);

      setSuccess(result.ok);
      setMessage(result.message);

      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold">
        Create today&apos;s service
      </h2>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700">
          Service title
        </label>

        <input
          name="title"
          required
          maxLength={150}
          placeholder="Sunday Celebration Service"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">
          Start time
        </label>

        <input
          name="startTime"
          type="time"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create service"}
      </button>

      {message && (
        <p
          className={
            success
              ? "mt-4 text-sm font-medium text-green-700"
              : "mt-4 text-sm font-medium text-red-700"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
