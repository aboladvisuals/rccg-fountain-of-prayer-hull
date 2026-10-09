"use client";
import { useState, useTransition } from "react";
import { signOut } from "./actions";

export default function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <div>
    <button disabled={pending} onClick={() => startTransition(async () => {
      setError("");
      const result = await signOut();
      if (result) setError(result.error);
    })} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
      {pending ? "Signing out…" : "Sign out"}
    </button>
    {error && <p role="alert" className="mt-2 max-w-xs text-sm text-red-700">{error}</p>}
  </div>;
}
