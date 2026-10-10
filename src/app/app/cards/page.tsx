import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createCard, renameCard, setCardActive } from "@/app/app/cards/actions";
import { createClient } from "@/lib/supabase/server";

type EntityOption = {
  id: string;
  name: string;
};

type CardRow = {
  id: string;
  entity_id: string;
  name: string;
  issuer_name: string | null;
  brand: string | null;
  last_four: string;
  is_active: boolean;
};

export default function CardsPage(props: PageProps<"/app/cards">) {
  return (
    <main>
      <Suspense fallback={null}>
        <CardScreen searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function CardScreen({
  searchParams,
}: {
  searchParams: PageProps<"/app/cards">["searchParams"];
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const { data: entityRows } = await supabase
    .from("entities")
    .select("id, name")
    .order("created_at", { ascending: true });
  const entities = (entityRows ?? []) as EntityOption[];
  const entityName = new Map(entities.map((entity) => [entity.id, entity.name]));

  const { data: cardRows } = await supabase
    .from("payment_cards")
    .select("id, entity_id, name, issuer_name, brand, last_four, is_active")
    .order("created_at", { ascending: true });
  const rows = (cardRows ?? []) as CardRow[];

  return (
    <>
      <h1>Assessor Financeiro</h1>
      <p className="switch">
        <Link href="/app">Voltar</Link>
      </p>
      {params.error === "invalid" ? (
        <p className="message" role="status">
          Verifique a entidade, o nome e os quatro dígitos do cartão.
        </p>
      ) : null}
      {params.error === "save" ? (
        <p className="message" role="status">
          Não foi possível salvar o cartão.
        </p>
      ) : null}
      {entities.length === 0 ? (
        <>
          <p>Cadastre uma entidade antes de adicionar contas ou cartões.</p>
          <p className="switch">
            <Link href="/app/entities">Entidades</Link>
          </p>
        </>
      ) : null}
      {rows.length === 0 && entities.length > 0 ? <p>Nenhum cartão cadastrado.</p> : null}
      {rows.length > 0 ? (
        <ul className="entity-list">
          {rows.map((card) => (
            <li key={card.id}>
              <p>
                {card.is_active ? "Cartão" : "Inativo"}
                {": "}
                {card.name}
              </p>
              <p>Entidade: {entityName.get(card.entity_id) ?? "Entidade"}</p>
              {card.issuer_name ? <p>Emissor: {card.issuer_name}</p> : null}
              {card.brand ? <p>Bandeira: {card.brand}</p> : null}
              <p>Final: {card.last_four}</p>
              <form action={renameCard} className="auth-form">
                <input type="hidden" name="id" value={card.id} />
                <label htmlFor={`name-${card.id}`}>Nome</label>
                <input id={`name-${card.id}`} name="name" defaultValue={card.name} required />
                <button type="submit">Salvar</button>
              </form>
              <form action={setCardActive}>
                <input type="hidden" name="id" value={card.id} />
                <input type="hidden" name="is_active" value={card.is_active ? "false" : "true"} />
                <button type="submit">{card.is_active ? "Desativar" : "Ativar"}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      {entities.length > 0 ? (
        <form action={createCard} className="auth-form">
          <label htmlFor="entity_id">Entidade</label>
          <select id="entity_id" name="entity_id" required>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
          <label htmlFor="name">Nome</label>
          <input id="name" name="name" required />
          <label htmlFor="issuer_name">Emissor</label>
          <input id="issuer_name" name="issuer_name" />
          <label htmlFor="brand">Bandeira</label>
          <input id="brand" name="brand" />
          <label htmlFor="last_four">Últimos 4 dígitos</label>
          <input id="last_four" name="last_four" inputMode="numeric" required />
          <button type="submit">Adicionar cartão</button>
        </form>
      ) : null}
    </>
  );
}
