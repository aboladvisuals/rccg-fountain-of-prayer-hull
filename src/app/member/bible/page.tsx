import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";

export default async function BiblePage() {
  await requireMemberSession();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">
          ← Member dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Bible</h1>
        <p className="mt-3 text-slate-600">
          Scripture is served through an authorised provider. This page does not store copyrighted Bible text.
        </p>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          API.Bible key is not configured yet. Set the server-only environment variable API_BIBLE_KEY, then implement passage loading in src/lib/bible/api-bible.ts. Until then, use an authorised external Bible.
        </p>
        <a
          href="https://www.bible.com/"
          className="mt-6 inline-flex rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white"
          target="_blank"
          rel="noreferrer"
        >
          Open authorised Bible ↗
        </a>
      </div>
    </main>
  );
}
