"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFamilyMember } from "./actions";

export default function FamilyForm() {
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
      const result = await addFamilyMember(formData);

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
      <h2 className="text-lg font-semibold">Add a family member</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            First name *
          </label>

          <input
            id="firstName"
            name="firstName"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Last name
          </label>

          <input
            id="lastName"
            name="lastName"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="relationship"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Relationship
        </label>

        <select
          id="relationship"
          name="relationship"
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-600"
        >
          <option value="">Select relationship</option>
          <option value="Spouse">Spouse</option>
          <option value="Son">Son</option>
          <option value="Daughter">Daughter</option>
          <option value="Child">Child</option>
          <option value="Parent">Parent</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add family member"}
      </button>

      {message && (
        <p
          role="status"
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
