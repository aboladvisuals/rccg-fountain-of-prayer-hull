"use client";
import Link from "next/link";
export default function MemberError({ reset }: { reset: () => void }) {
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900"><div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
    <h1 className="text-2xl font-bold">We couldn’t load your dashboard</h1>
    <p className="mt-3 text-slate-600">Please try again. If the problem continues, contact the church team.</p>
    <button onClick={reset} className="mt-6 rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white">Try again</button>
    <Link href="/" className="ml-5 text-sm text-purple-700">Church home</Link>
  </div></main>;
}

