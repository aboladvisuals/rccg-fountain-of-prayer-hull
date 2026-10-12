"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    }
  | {
      type: "verse";
      title: string;
      content: string;
    }
  | {
      type: "lyrics";
      title: string;
      content: string;
    };

export type PresentationState = {
  mode: "auto" | "manual" | "blank";
  slideType: string | null;
  title: string | null;
  content: string | null;
  payload: Record<string, unknown>;
  updatedAt: string;
};

type PresentationStateRow = {
  mode: "auto" | "manual" | "blank";
  slide_type: string | null;
  title: string | null;
  content: string | null;
  payload: Record<string, unknown> | null;
  updated_at: string;
};

function toPresentationState(
  row: PresentationStateRow
): PresentationState {
  return {
    mode: row.mode,
    slideType: row.slide_type,
    title: row.title,
    content: row.content,
    payload:
      row.payload && typeof row.payload === "object"
        ? row.payload
        : {},
    updatedAt: row.updated_at,
  };
}

function manualSlideFromState(
  state: PresentationState
): DisplaySlide | null {
  if (state.mode !== "manual" || !state.slideType || !state.title) {
    return null;
  }

  if (
    state.slideType === "welcome" ||
    state.slideType === "announcement" ||
    state.slideType === "testimony" ||
    state.slideType === "verse" ||
    state.slideType === "lyrics"
  ) {
    return {
      type: state.slideType,
      title: state.title,
      content: state.content ?? "",
    };
  }

  if (
    state.slideType === "birthday" ||
    state.slideType === "serving"
  ) {
    const names = Array.isArray(state.payload.names)
      ? state.payload.names.filter(
          (name): name is string => typeof name === "string"
        )
      : [];

    return {
      type: state.slideType,
      title: state.title,
      names,
    };
  }

  if (state.slideType === "presence") {
    const members = Array.isArray(state.payload.members)
      ? state.payload.members.filter(
          (name): name is string => typeof name === "string"
        )
      : [];

    const visitors = Array.isArray(state.payload.visitors)
      ? state.payload.visitors.filter(
          (name): name is string => typeof name === "string"
        )
      : [];

    return {
      type: "presence",
      title: state.title,
      members,
      visitors,
    };
  }

  return null;
}

export default function RotatingDisplay({
  slides,
  serviceTitle,
  organisationId,
  locationId,
  initialPresentationState,
}: {
  slides: DisplaySlide[];
  serviceTitle: string;
  organisationId: string | null;
  locationId: string | null;
  initialPresentationState: PresentationState | null;
}) {
  const [index, setIndex] = useState(0);
  const [presentationState, setPresentationState] =
    useState<PresentationState | null>(initialPresentationState);

  const activeSlide = useMemo(() => {
    if (presentationState?.mode === "blank") {
      return null;
    }

    if (presentationState?.mode === "manual") {
      return manualSlideFromState(presentationState);
    }

    return slides[index] ?? null;
  }, [presentationState, slides, index]);

  useEffect(() => {
    if (presentationState?.mode !== "auto") {
      return;
    }

    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [presentationState?.mode, slides.length]);

  useEffect(() => {
    if (!organisationId || !locationId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`presentation-state:${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presentation_state",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          if (!payload.new || !("mode" in payload.new)) {
            return;
          }

          const row = payload.new as PresentationStateRow;

          setPresentationState(toPresentationState(row));

          if (row.mode === "auto") {
            setIndex(0);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [organisationId, locationId]);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      if (presentationState?.mode === "auto") {
        window.location.reload();
      }
    }, 60000);

    return () => window.clearInterval(refresh);
  }, [presentationState?.mode]);

  if (presentationState?.mode === "blank") {
    return <main className="min-h-screen bg-black" />;
  }

  if (!activeSlide) {
    return <main className="min-h-screen bg-slate-950" />;
  }

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
              {presentationState?.mode === "manual"
                ? "Presenter control"
                : "Live service"}
            </p>

            <p className="mt-1 text-lg font-semibold">
              {presentationState?.mode === "manual"
                ? "Manual"
                : serviceTitle}
            </p>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          {(activeSlide.type === "welcome" ||
            activeSlide.type === "announcement" ||
            activeSlide.type === "testimony" ||
            activeSlide.type === "verse" ||
            activeSlide.type === "lyrics") && (
            <div className="w-full max-w-6xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                {activeSlide.type === "announcement"
                  ? "Announcement"
                  : activeSlide.type === "testimony"
                    ? "Testimony"
                    : activeSlide.type === "verse"
                      ? "Bible verse"
                      : activeSlide.type === "lyrics"
                        ? "Lyrics"
                        : "Welcome"}
              </p>

              <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                {activeSlide.title}
              </h2>

              <p className="mx-auto mt-8 max-w-5xl whitespace-pre-wrap text-2xl leading-relaxed text-slate-200 lg:text-3xl">
                {activeSlide.content}
              </p>
            </div>
          )}

          {activeSlide.type === "birthday" && (
            <div className="w-full text-center">
              <p className="text-lg font-semibold uppercase tracking-[0.25em] text-amber-300">
                Celebrating today
              </p>

              <h2 className="mt-6 text-5xl font-bold lg:text-7xl">
                {activeSlide.title}
              </h2>

              <div className="mt-10 flex flex-wrap justify-center gap-5">
                {activeSlide.names.map((name) => (
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

          {activeSlide.type === "presence" && (
            <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2">
              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
                  Members & family
                </p>

                <div className="mt-6 space-y-4">
                  {activeSlide.members.map((name) => (
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
                  {activeSlide.visitors.map((name) => (
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

          {activeSlide.type === "serving" && (
            <div className="w-full max-w-5xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                Serving today
              </p>

              <h2 className="mt-6 text-5xl font-bold lg:text-7xl">
                {activeSlide.title}
              </h2>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {activeSlide.names.map((name) => (
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
            {presentationState?.mode === "manual"
              ? "Manual presentation"
              : `${index + 1} / ${slides.length}`}
          </span>
        </footer>
      </div>
    </main>
  );
}