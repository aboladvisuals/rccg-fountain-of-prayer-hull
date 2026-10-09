import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { memberDestination } from "@/lib/auth/redirects";
import LoginForm from "./login-form";

export const metadata = { title: "Member login | Fountain of Prayer Hull" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string; error?: string; signedOut?: string }>;
}) {
  const params = await searchParams;
  const next = memberDestination(params.next);
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) redirect(next);
  return <LoginForm next={next} authError={Boolean(params.error)} signedOut={params.signedOut === "1"} />;
}
