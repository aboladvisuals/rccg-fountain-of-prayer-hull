import type { NavItem } from "./AppNav";

// Navigation is a convenience only. Each destination enforces its own
// session, role and organisation checks on the server.
export const memberNav: NavItem[] = [
  { href: "/member", label: "Overview", exact: true },
  { href: "/member/family", label: "Family" },
  { href: "/member/history", label: "Attendance" },
  { href: "/member/testimony", label: "Testimony" },
  { href: "/member/private-note", label: "Private note" },
  { href: "/member/bible", label: "Bible" },
  { href: "/member/hymnal", label: "Hymnal" },
  { href: "/member/profile", label: "Profile & privacy" },
  { href: "/member/password", label: "Password" },
];

export const pastorNav: NavItem[] = [
  { href: "/pastor", label: "Dashboard", exact: true },
  { href: "/pastor/services", label: "Services" },
  { href: "/pastor/presence", label: "Live presence" },
  { href: "/pastor/visitors", label: "Visitors" },
  { href: "/pastor/testimonies", label: "Testimonies" },
  { href: "/pastor/private-notes", label: "Private notes" },
  { href: "/pastor/announcements", label: "Announcements" },
  { href: "/pastor/display-settings", label: "Display settings" },
  { href: "/media", label: "Media" },
  { href: "/member", label: "My member area", exact: true },
];

export const adminNav: NavItem[] = [
  { href: "/admin/users", label: "Users & roles" },
  { href: "/admin/departments", label: "Departments" },
  { href: "/pastor", label: "Pastor dashboard", exact: true },
  { href: "/member", label: "My member area", exact: true },
];

export const mediaNav: NavItem[] = [
  { href: "/media", label: "Live controls", exact: true },
  { href: "/display", label: "Auditorium display" },
  { href: "/member", label: "My member area", exact: true },
];
