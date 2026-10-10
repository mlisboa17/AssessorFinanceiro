import Link from "next/link";
import { SignupForm } from "@/app/signup/signup-form";

export default function SignupPage() {
  return (
    <main>
      <h1>Assessor Financeiro</h1>
      <SignupForm />
      <p className="switch">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </main>
  );
}
