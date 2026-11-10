import Link from "next/link";
import { requireMemberSession } from "@/lib/member/session";

const sample = [
  { number: 1, title: "Forth in Your Name, O Lord, I Go" },
  { number: 329, title: "Rejoice, the Lord Is King!" },
];

export default async function HymnalPage() {
  await requireMemberSession();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/member" className="text-sm font-semibold text-purple-700">
          ← Member dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Hymnal</h1>
        <p className="mt-3 text-sm text-slate-600">
          Index only. Lyrics are not stored. Confirm the authorised RCCG Redeemed Hymnal edition and permission before adding content.
        </p>
        <ul className="mt-6 space-y-3">
          {sample.map((hymn) => (
            <li
              key={hymn.number}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="font-semibold">
                {hymn.number}. {hymn.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Metadata example only — not a complete authorised index.
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
