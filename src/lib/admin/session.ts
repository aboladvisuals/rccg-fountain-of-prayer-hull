import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/staff/session";

export async function requireAdminSession() {
  const session = await requireStaffSession();

  if (session.role !== "admin") {
    redirect("/pastor");
  }

  return {
    ...session,
    role: "admin" as const,
  };
}