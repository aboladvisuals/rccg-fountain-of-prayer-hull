import AppFrame from "@/components/app/AppFrame";
import { adminNav } from "@/components/app/navigation";

// Presentation only. Every admin page calls requireAdminSession() itself.
export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame area="Administrator" nav={adminNav}>
      {children}
    </AppFrame>
  );
}
