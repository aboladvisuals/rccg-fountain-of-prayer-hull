"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPrivateNote } from "./actions";

export default function PrivateNoteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResult("");

    startTransition(async () => {
      const response = await submitPrivateNote(formData);

      setSuccess(response.ok);
      setResult(response.message);

      if (response.ok) {
        setMessage("");
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
        Send a private note
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        This message is intended for the pastoral team and is not shown on the church display.
      </p>

      <div className="mt-5">
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Your message
        </label>

        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your private note here..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Private to the pastoral team</span>
        <span>{message.length}/2000</span>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send private note"}
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
