import AppFrame from "@/components/app/AppFrame";
import { mediaNav } from "@/components/app/navigation";

// Presentation only. The media page calls requireMediaSession() itself.
export const metadata = { robots: { index: false, follow: false } };

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame area="Media team" nav={mediaNav} tone="operations">
      {children}
    </AppFrame>
  );
}
