import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "./password-form";

export default async function MemberPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/member/password");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-700">
          Account security
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Set or change your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a secure password for direct sign-in. Your Magic Link login will
          continue to work as an alternative.
        </p>

        <div className="mt-8">
          <PasswordForm />
        </div>
      </div>
    </main>
  );
}