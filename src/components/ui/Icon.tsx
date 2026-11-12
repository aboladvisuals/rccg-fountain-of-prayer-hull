/** Small stroke icon set (original, 24px grid). Decorative unless labelled by context. */
const paths: Record<string, string> = {
  family: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M13.5 16.2c.7-1.4 1.6-2.2 2.9-2.2 2 0 3.6 1.6 4.1 4.6",
  history: "M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 8v4.5l3 1.8",
  note: "M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h5",
  testimony: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c.8-3.6 3.6-6 7-6s6.2 2.4 7 6",
  bible: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5v-16ZM5 20.5A1.5 1.5 0 0 0 6.5 22H19M12 7v6M9.5 9.5h5",
  hymnal: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Zm7 4v2",
  presence: "M12 21s-6-5.3-6-10.5a6 6 0 1 1 12 0C18 15.7 12 21 12 21Zm0-8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  department: "M4 20V9l8-5 8 5v11M9 20v-6h6v6M4 20h16",
  shield: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  calendar: "M4 6h16v15H4V6Zm0 5h16M9 3v5M15 3v5",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c.7-3.4 3.2-5.5 6-5.5s5.3 2.1 6 5.5M16 4.5a3.5 3.5 0 0 1 0 6.8M18 14.8c1.5.8 2.6 2.6 3 5.2",
  screen: "M3 5h18v11H3V5Zm6 15h6m-3-4v4",
  megaphone: "M4 10v4h3l7 4V6L7 10H4Zm14-1a4 4 0 0 1 0 6",
  sliders: "M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4M8 15v4",
  visitor: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10c.8-3.6 3.6-6 7-6 1.2 0 2.3.3 3.3.8M18 15v6m-3-3h6",
};

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
