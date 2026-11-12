import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";

export default async function BiblePage() {
  await requireMemberSession();

  return (
    <main className="app-page">
      <div className="mx-auto max-w-3xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">
          ← Member dashboard
        </Link>
        <h1 className="mt-6 text-4xl display-title">Bible</h1>
        <p className="mt-3 text-slate-600">
          Scripture is served through an authorised provider. This page does not store copyrighted Bible text.
        </p>
        <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          Reading the Bible inside the member area is not available yet. In the meantime, you can read
          scripture on an authorised external Bible website.
        </p>
        <a
          href="https://www.bible.com/"
          className="mt-6 inline-flex rounded-xl bg-purple-700 px-4 py-3 text-sm font-semibold text-white btn-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open authorised Bible ↗<span className="sr-only"> (opens Bible.com, an external site, in a new tab)</span>
        </a>
        <p className="mt-3 text-xs text-slate-500">Opens Bible.com, an external website, in a new tab.</p>
      </div>
    </main>
  );
}
