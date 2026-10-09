"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "./actions";

export default function AnnouncementForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResult("");

    startTransition(async () => {
      const response = await createAnnouncement(formData);

      setSuccess(response.ok);
      setResult(response.message);

      if (response.ok) {
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
        Create announcement
      </h2>

      <div className="mt-5">
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Title
        </label>

        <input
          id="title"
          name="title"
          required
          maxLength={150}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
          placeholder="Sunday service announcement"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="body"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Announcement
        </label>

        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          rows={6}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
          placeholder="Write the announcement..."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating..." : "Publish announcement"}
      </button>

      {result && (
        <p
          className={
            success
              ? "mt-4 text-sm font-medium text-green-700"
              : "mt-4 text-sm font-medium text-red-700"
          }
        >
          {result}
        </p>
      )}
    </form>
  );
}
