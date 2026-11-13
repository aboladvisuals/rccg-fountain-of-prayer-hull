import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";

/** Navigational card used on dashboards. Status text must describe what the destination really offers. */
export default function ToolCard({
  href,
  title,
  description,
  icon,
  note,
  badge,
  badgeLabel,
  newTab = false,
  tone = "default",
}: {
  href: string;
  title: string;
  description: string;
  icon: IconName;
  note?: string;
  /** Optional count, e.g. unread notes. Hidden when zero. */
  badge?: number;
  badgeLabel?: string;
  newTab?: boolean;
  tone?: "default" | "accent";
}) {
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener" : undefined}
      className={`app-card group flex h-full flex-col gap-3 p-5 sm:p-6 ${tone === "accent" ? "app-card-accent" : ""}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="tool-icon">
          <Icon name={icon} />
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-gold-500 px-2.5 py-1 text-xs font-bold text-ink-950">
            {badge}
            <span className="sr-only"> {badgeLabel ?? "pending"}</span>
          </span>
        )}
      </span>
      <span className="flex items-center justify-between gap-3">
        <span className="text-[1.05rem] font-semibold text-slate-900">
          {title}
          {newTab && <span className="sr-only"> (opens in a new tab)</span>}
        </span>
        <span className="text-purple-700 transition-transform duration-300 group-hover:translate-x-1">
          <Icon name="arrow" size={18} />
        </span>
      </span>
      <span className="text-sm leading-6 text-slate-600">{description}</span>
      {note && (
        <span className="mt-auto w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {note}
        </span>
      )}
    </Link>
  );
}
