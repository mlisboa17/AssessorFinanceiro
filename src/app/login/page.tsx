import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main>
      <h1>Assessor Financeiro</h1>
      <LoginForm />
      <p className="switch">
        Ainda não tem conta? <Link href="/signup">Criar conta</Link>
      </p>
    </main>
  );
}
