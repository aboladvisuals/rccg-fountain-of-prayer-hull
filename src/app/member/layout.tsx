import { requireMemberSession } from "@/lib/member/session";
import AppFrame from "@/components/app/AppFrame";
import { memberNav } from "@/components/app/navigation";
import SignOutButton from "./sign-out-button";

export const metadata = { title: "My church | Fountain of Prayer Hull", robots: { index: false, follow: false } };

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireMemberSession();
  return (
    <AppFrame area="Member area" nav={memberNav} actions={<SignOutButton />}>
      {children}
    </AppFrame>
  );
}
