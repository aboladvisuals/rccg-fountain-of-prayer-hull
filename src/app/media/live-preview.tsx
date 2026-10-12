"use client";

import { useState } from "react";

export default function LivePreview() {
  const [key, setKey] = useState(0);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Live preview
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Auditorium screen
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            This preview mirrors what is currently being shown on the auditorium display.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setKey((current) => current + 1)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-purple-300"
        >
          Refresh preview
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-black">
        <div className="aspect-video w-full">
          <iframe
            key={key}
            src="/display"
            title="Auditorium display preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}