"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplaySettings } from "./actions";

type Props = {
  welcomeMessage: string;
  showBirthdays: boolean;
  showServingTeam: boolean;
  showPresence: boolean;
};

export default function DisplaySettingsForm({
  welcomeMessage,
  showBirthdays,
  showServingTeam,
  showPresence,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");

    startTransition(async () => {
      const result = await updateDisplaySettings(formData);

      setSuccess(result.ok);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="welcomeMessage"
          className="block text-sm font-medium text-slate-700"
        >
          Welcome message
        </label>

        <textarea
          id="welcomeMessage"
          name="welcomeMessage"
          required
          maxLength={500}
          rows={5}
          defaultValue={welcomeMessage}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
        />
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-medium text-slate-900">
              Show birthdays
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Show today&apos;s birthdays on the auditorium display.
            </p>
          </div>

          <input
            type="checkbox"
            name="showBirthdays"
            defaultChecked={showBirthdays}
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-medium text-slate-900">
              Show serving team
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Show members who marked themselves as serving.
            </p>
          </div>

          <input
            type="checkbox"
            name="showServingTeam"
            defaultChecked={showServingTeam}
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-medium text-slate-900">
              Show presence
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Show consented member, family and visitor names.
            </p>
          </div>

          <input
            type="checkbox"
            name="showPresence"
            defaultChecked={showPresence}
            className="h-5 w-5"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save display settings"}
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
