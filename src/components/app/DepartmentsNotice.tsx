import { departmentsMessage, type DepartmentsAvailability } from "@/lib/departments/availability";

export default function DepartmentsNotice({ state, className = "" }: { state: DepartmentsAvailability; className?: string }) {
  const message = departmentsMessage(state);
  if (!message) return null;
  return (
    <div role="status" className={`notice border-amber-200 bg-amber-50 text-amber-950 ${className}`}>
      {message}
    </div>
  );
}
