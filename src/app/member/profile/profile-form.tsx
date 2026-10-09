"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";

type Props = {
  email: string;
  fullName: string;
  firstName: string;
  phone: string;
  showNameOnDisplay: boolean;
  showFamilyOnDisplay: boolean;
  birthMonth: number | null;
  birthDay: number | null;
};

export default function ProfileForm({
  email,
  fullName,
  firstName,
  phone,
  showNameOnDisplay,
  showFamilyOnDisplay,
  birthMonth,
  birthDay,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);

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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full name
          </label>

          <input
            name="fullName"
            defaultValue={fullName}
            maxLength={150}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            First name
          </label>

          <input
            name="firstName"
            defaultValue={firstName}
            maxLength={100}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>

          <input
            value={email}
            disabled
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Phone
          </label>

          <input
            name="phone"
            defaultValue={phone}
            maxLength={50}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Birth month
          </label>

          <input
            name="birthMonth"
            type="number"
            min="1"
            max="12"
            defaultValue={birthMonth ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Birth day
          </label>

          <input
            name="birthDay"
            type="number"
            min="1"
            max="31"
            defaultValue={birthDay ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-medium">
              Show my name on church display
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Allows your display-safe name to appear during services.
            </p>
          </div>

          <input
            name="showNameOnDisplay"
            type="checkbox"
            defaultChecked={showNameOnDisplay}
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="font-medium">
              Allow my family names on display
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Controls whether family names may be shown where applicable.
            </p>
          </div>

          <input
            name="showFamilyOnDisplay"
            type="checkbox"
            defaultChecked={showFamilyOnDisplay}
            className="h-5 w-5"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save profile"}
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
