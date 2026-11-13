import AppFrame from "@/components/app/AppFrame";
import { pastorNav } from "@/components/app/navigation";

// Presentation only. Every pastor page calls requireStaffSession() itself.
export const metadata = { robots: { index: false, follow: false } };

export default function PastorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame area="Pastor & Admin" nav={pastorNav}>
      {children}
    </AppFrame>
  );
}
