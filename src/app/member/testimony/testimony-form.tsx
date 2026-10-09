"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitTestimony } from "./actions";

export default function TestimonyForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResult("");

    startTransition(async () => {
      const response = await submitTestimony(formData);

      setSuccess(response.ok);
      setResult(response.message);

      if (response.ok) {
        setContent("");
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
        Share a testimony
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Your testimony will be reviewed by the pastoral team before it can be made public.
      </p>

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
          maxLength={150}
          placeholder="Optional title"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Your testimony *
        </label>

        <textarea
          id="content"
          name="content"
          required
          maxLength={5000}
          rows={8}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share what God has done in your life..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
        />
      </div>

      <div className="mt-2 text-right text-xs text-slate-500">
        {content.length}/5000
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit testimony"}
      </button>

      {result && (
        <p
          role="status"
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
