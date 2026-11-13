"use client";
import Link from "next/link";
export default function MemberError({ reset }: { reset: () => void }) {
  return <main className="app-page"><div className="app-card mx-auto max-w-lg p-8">
    <h1 className="text-2xl display-title">We couldn’t load your dashboard</h1>
    <p className="mt-3 text-slate-600">Please try again. If the problem continues, contact the church team.</p>
    <button onClick={reset} className="mt-6 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white btn-primary min-h-11">Try again</button>
    <Link href="/" className="ml-5 text-sm text-purple-700">Church home</Link>
  </div></main>;
}

