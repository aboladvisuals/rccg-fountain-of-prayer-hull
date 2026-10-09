import { requireMemberSession } from "@/lib/member/session";

export const metadata = { title: "My church | Fountain of Prayer Hull", robots: { index: false, follow: false } };

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireMemberSession();
  return children;
}
