"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInFamilyMember } from "./actions";

type Props = {
  memberId: string;
  serviceId: string;
  firstName: string;
  checkedIn: boolean;
};

export default function FamilyCheckInButton({
  memberId,
  serviceId,
  firstName,
  checkedIn,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  if (checkedIn) {
    return (
      <p className="mt-3 text-sm font-semibold text-green-700">
        ✓ Checked in
      </p>
    );
  }

  function handleCheckIn() {
    setMessage("");

    startTransition(async () => {
      const result = await checkInFamilyMember(memberId, serviceId);

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
        onClick={handleCheckIn}
        className="rounded-xl bg-purple-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Checking in..." : `Check in ${firstName}`}
      </button>

      {message && (
        <p className="mt-2 text-sm text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}
