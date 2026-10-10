import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/app/actions";
import { emailFromVerifiedClaims } from "@/lib/supabase/auth-messages";
import { createClient } from "@/lib/supabase/server";

export default function AppPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <AuthenticatedSession />
      </Suspense>
    </main>
  );
}

async function AuthenticatedSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = emailFromVerifiedClaims(data?.claims ?? null);

  if (!email) {
    redirect("/login");
  }

  return (
    <>
      <h1>Assessor Financeiro</h1>
      <p>Autenticação concluída.</p>
      <p>E-mail: {email}</p>
      <p className="switch">
        <Link href="/app/entities">Entidades</Link>
      </p>
      <p className="switch">
        <Link href="/app/accounts">Contas</Link>
      </p>
      <p className="switch">
        <Link href="/app/cards">Cartões</Link>
      </p>
      <p className="switch">
        <Link href="/app/categories">Categorias</Link>
      </p>
      <form action={signOut}>
        <button type="submit">Sair</button>
      </form>
    </>
  );
}
