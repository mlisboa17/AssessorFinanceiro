import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main>
      <h1>Assessor Financeiro</h1>
      <Suspense fallback={null}>
        <LoginNotice searchParams={props.searchParams} />
      </Suspense>
      <LoginForm />
      <p className="switch">
        Ainda não tem conta? <Link href="/signup">Criar conta</Link>
      </p>
    </main>
  );
}

async function LoginNotice({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;

  if (params.error !== "confirmation") {
    return null;
  }

  return (
    <p className="message" role="status">
      Não foi possível confirmar o e-mail. Entre com a senha ou crie a conta de novo.
    </p>
  );
}
