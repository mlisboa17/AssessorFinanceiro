import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createEntity, renameEntity, setEntityActive } from "@/app/app/entities/actions";
import { entityTypeLabel, type EntityType } from "@/lib/entities/input";
import { createClient } from "@/lib/supabase/server";

type EntityRow = {
  id: string;
  type: EntityType;
  name: string;
  document_number: string | null;
  is_active: boolean;
};

export default function EntitiesPage(props: PageProps<"/app/entities">) {
  return (
    <main>
      <Suspense fallback={null}>
        <EntityScreen searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function EntityScreen({
  searchParams,
}: {
  searchParams: PageProps<"/app/entities">["searchParams"];
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const { data: entities } = await supabase
    .from("entities")
    .select("id, type, name, document_number, is_active")
    .order("created_at", { ascending: true });

  const rows = (entities ?? []) as EntityRow[];

  return (
    <>
      <h1>Assessor Financeiro</h1>
      <p className="switch">
        <Link href="/app">Voltar</Link>
      </p>
      {params.error === "invalid" ? (
        <p className="message" role="status">
          Verifique o tipo e o nome da entidade.
        </p>
      ) : null}
      {params.error === "save" ? (
        <p className="message" role="status">
          Não foi possível salvar a entidade.
        </p>
      ) : null}
      {rows.length === 0 ? <p>Nenhuma entidade cadastrada.</p> : null}
      {rows.length > 0 ? (
        <ul className="entity-list">
          {rows.map((entity) => (
            <li key={entity.id}>
              <p>
                {entity.is_active ? entityTypeLabel(entity.type) : "Inativa"}
                {": "}
                {entity.name}
              </p>
              {entity.document_number ? <p>Documento: {entity.document_number}</p> : null}
              <form action={renameEntity} className="auth-form">
                <input type="hidden" name="id" value={entity.id} />
                <label htmlFor={`name-${entity.id}`}>Nome</label>
                <input id={`name-${entity.id}`} name="name" defaultValue={entity.name} required />
                <button type="submit">Salvar</button>
              </form>
              <form action={setEntityActive}>
                <input type="hidden" name="id" value={entity.id} />
                <input type="hidden" name="is_active" value={entity.is_active ? "false" : "true"} />
                <button type="submit">{entity.is_active ? "Desativar" : "Ativar"}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <form id="adicionar" action={createEntity} className="auth-form">
        <label htmlFor="type">Tipo</label>
        <select id="type" name="type" defaultValue="PERSON">
          <option value="PERSON">Pessoa Física</option>
          <option value="COMPANY">Empresa</option>
        </select>
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" required />
        <label htmlFor="document_number">CPF/CNPJ</label>
        <input id="document_number" name="document_number" inputMode="numeric" />
        <button type="submit">Adicionar entidade</button>
      </form>
    </>
  );
}
