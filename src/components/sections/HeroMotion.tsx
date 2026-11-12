"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "@/components/public/public.module.css";

/**
 * Gentle pointer-driven 2.5D tilt for the decorative sanctuary composition.
 * - Desktop pointers only; disabled for touch and for prefers-reduced-motion.
 * - Writes two CSS custom properties per animation frame; no re-renders.
 */
export function TiltStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const host = el.closest("section") ?? el;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--tilt-x", x.toFixed(3));
      el.style.setProperty("--tilt-y", y.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    host.addEventListener("pointermove", onMove as EventListener, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove as EventListener);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={s.tiltStage}>
      {children}
    </div>
  );
}

/** Pause / resume control for the ambient hero animation (WCAG 2.2.2). */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = ref.current?.closest("[data-motion-root]");
    if (root) root.setAttribute("data-paused", paused ? "true" : "false");
  }, [paused]);

  return (
    <button
      ref={ref}
      type="button"
      className={s.motionToggle}
      aria-pressed={paused}
      onClick={() => setPaused((value) => !value)}
    >
      <span aria-hidden="true" className={s.motionIcon}>
        {paused ? "▶" : "❚❚"}
      </span>
      {paused ? "Play motion" : "Pause motion"}
    </button>
  );
}
