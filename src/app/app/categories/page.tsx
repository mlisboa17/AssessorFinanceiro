import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createCategory,
  renameCategory,
  setCategoryActive,
} from "@/app/app/categories/actions";
import { categoryKindLabel, categoryKinds, type CategoryKind } from "@/lib/categories/input";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  kind: CategoryKind;
  is_system: boolean;
  is_active: boolean;
};

export default function CategoriesPage(props: PageProps<"/app/categories">) {
  return (
    <main>
      <Suspense fallback={null}>
        <CategoryScreen searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function CategoryScreen({
  searchParams,
}: {
  searchParams: PageProps<"/app/categories">["searchParams"];
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name, kind, is_system, is_active")
    .order("name", { ascending: true });
  const rows = (categoryRows ?? []) as CategoryRow[];
  const systemRows = rows.filter((category) => category.is_system);
  const customRows = rows.filter((category) => !category.is_system);

  return (
    <>
      <h1>Assessor Financeiro</h1>
      <p className="switch">
        <Link href="/app">Voltar</Link>
      </p>
      {params.error === "invalid" ? (
        <p className="message" role="status">
          Verifique o nome e o tipo da categoria.
        </p>
      ) : null}
      {params.error === "save" ? (
        <p className="message" role="status">
          Não foi possível salvar a categoria.
        </p>
      ) : null}
      <h2>Categorias padrão</h2>
      <ul className="entity-list">
        {systemRows.map((category) => (
          <li key={category.id}>
            <p>
              {categoryKindLabel(category.kind)}
              {": "}
              {category.name}
            </p>
          </li>
        ))}
      </ul>
      <h2>Categorias personalizadas</h2>
      {customRows.length === 0 ? <p>Nenhuma categoria personalizada.</p> : null}
      {customRows.length > 0 ? (
        <ul className="entity-list">
          {customRows.map((category) => (
            <li key={category.id}>
              <p>
                {category.is_active ? categoryKindLabel(category.kind) : "Inativa"}
                {": "}
                {category.name}
              </p>
              <form action={renameCategory} className="auth-form">
                <input type="hidden" name="id" value={category.id} />
                <label htmlFor={`name-${category.id}`}>Nome</label>
                <input id={`name-${category.id}`} name="name" defaultValue={category.name} required />
                <button type="submit">Salvar</button>
              </form>
              <form action={setCategoryActive}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="is_active" value={category.is_active ? "false" : "true"} />
                <button type="submit">{category.is_active ? "Desativar" : "Ativar"}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <form action={createCategory} className="auth-form">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" required />
        <label htmlFor="kind">Tipo</label>
        <select id="kind" name="kind" defaultValue="EXPENSE">
          {categoryKinds.map((kind) => (
            <option key={kind} value={kind}>
              {categoryKindLabel(kind)}
            </option>
          ))}
        </select>
        <button type="submit">Adicionar categoria</button>
      </form>
    </>
  );
}
