"use client";

import { useEffect, useState } from "react";

export type DisplaySlide =
  | {
      type: "welcome";
      title: string;
      content: string;
    }
  | {
      type: "announcement";
      title: string;
      content: string;
    }
  | {
      type: "testimony";
      title: string;
      content: string;
    }
  | {
      type: "birthday";
      title: string;
      names: string[];
    }
  | {
      type: "presence";
      title: string;
      members: string[];
      visitors: string[];
    }
  | {
      type: "serving";
      title: string;
      names: string[];
    };

export default function RotatingDisplay({
  slides,
  serviceTitle,
}: {
  slides: DisplaySlide[];
  serviceTitle: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      window.location.reload();
    }, 60000);

    return () => window.clearInterval(refresh);
  }, []);

  const slide = slides[index];

  if (!slide) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-8 py-8 lg:px-14 lg:py-10">

        <header className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
              RCCG
            </p>

            <h1 className="mt-2 text-3xl font-bold lg:text-5xl">
              Fountain of Prayer Hull
            </h1>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-400">
              Live service
            </p>

            <p className="mt-1 text-lg font-semibold">
              {serviceTitle}
            </p>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">

          {(slide.type === "welcome" ||
            slide.type === "announcement" ||
            slide.type === "testimony") && (
            <div className="w-full max-w-6xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                {slide.type === "announcement"
                  ? "Announcement"
                  : slide.type === "testimony"
                  ? "Testimony"
                  : "Welcome"}
              </p>

              <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                {slide.title}
              </h2>

              <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-slate-200 lg:text-3xl">
                {slide.content}
              </p>
            </div>
          )}

          {slide.type === "birthday" && (
            <div className="w-full text-center">
              <p className="text-lg font-semibold uppercase tracking-[0.25em] text-amber-300">
                Celebrating today
              </p>

              <h2 className="mt-6 text-5xl font-bold lg:text-7xl">
                {slide.title}
              </h2>

              <div className="mt-10 flex flex-wrap justify-center gap-5">
                {slide.names.map((name) => (
                  <span
                    key={name}
                    className="rounded-3xl bg-amber-400/10 px-8 py-5 text-3xl font-semibold text-amber-100"
                  >
                    🎉 {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {slide.type === "presence" && (
            <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2">
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
                  Members & family
                </p>

                <div className="mt-6 space-y-4">
                  {slide.members.map((name) => (
                    <div
                      key={name}
                      className="rounded-2xl bg-white/5 px-6 py-5 text-2xl font-semibold"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Welcome visitors
                </p>

                <div className="mt-6 space-y-4">
                  {slide.visitors.map((name) => (
                    <div
                      key={name}
                      className="rounded-2xl bg-amber-400/10 px-6 py-5 text-2xl font-semibold text-amber-100"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {slide.type === "serving" && (
            <div className="w-full max-w-5xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                Serving today
              </p>

              <h2 className="mt-6 text-5xl font-bold lg:text-7xl">
                {slide.title}
              </h2>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {slide.names.map((name) => (
                  <span
                    key={name}
                    className="rounded-2xl bg-purple-500/20 px-7 py-4 text-2xl font-semibold text-purple-100"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </section>

        <footer className="flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-500">
          <span>RCCG Fountain of Prayer Hull</span>

          <span>
            {index + 1} / {slides.length}
          </span>
        </footer>
      </div>
    </main>
  );
}
