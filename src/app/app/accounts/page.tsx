import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAccount, renameAccount, setAccountActive } from "@/app/app/accounts/actions";
import { accountTypeLabel, accountTypes, type AccountType } from "@/lib/accounts/input";
import { createClient } from "@/lib/supabase/server";

type EntityOption = {
  id: string;
  name: string;
};

type AccountRow = {
  id: string;
  entity_id: string;
  name: string;
  institution_name: string | null;
  account_type: AccountType;
  last_four: string | null;
  is_active: boolean;
};

export default function AccountsPage(props: PageProps<"/app/accounts">) {
  return (
    <main>
      <Suspense fallback={null}>
        <AccountScreen searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function AccountScreen({
  searchParams,
}: {
  searchParams: PageProps<"/app/accounts">["searchParams"];
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

  const { data: accountRows } = await supabase
    .from("financial_accounts")
    .select("id, entity_id, name, institution_name, account_type, last_four, is_active")
    .order("created_at", { ascending: true });
  const rows = (accountRows ?? []) as AccountRow[];

  return (
    <>
      <h1>Assessor Financeiro</h1>
      <p className="switch">
        <Link href="/app">Voltar</Link>
      </p>
      {params.error === "invalid" ? (
        <p className="message" role="status">
          Verifique a entidade, o tipo e o nome da conta.
        </p>
      ) : null}
      {params.error === "save" ? (
        <p className="message" role="status">
          Não foi possível salvar a conta.
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
      {rows.length === 0 && entities.length > 0 ? <p>Nenhuma conta cadastrada.</p> : null}
      {rows.length > 0 ? (
        <ul className="entity-list">
          {rows.map((account) => (
            <li key={account.id}>
              <p>
                {account.is_active ? accountTypeLabel(account.account_type) : "Inativa"}
                {": "}
                {account.name}
              </p>
              <p>Entidade: {entityName.get(account.entity_id) ?? "Entidade"}</p>
              {account.institution_name ? <p>Instituição: {account.institution_name}</p> : null}
              {account.last_four ? <p>Final: {account.last_four}</p> : null}
              <form action={renameAccount} className="auth-form">
                <input type="hidden" name="id" value={account.id} />
                <label htmlFor={`name-${account.id}`}>Nome</label>
                <input id={`name-${account.id}`} name="name" defaultValue={account.name} required />
                <button type="submit">Salvar</button>
              </form>
              <form action={setAccountActive}>
                <input type="hidden" name="id" value={account.id} />
                <input type="hidden" name="is_active" value={account.is_active ? "false" : "true"} />
                <button type="submit">{account.is_active ? "Desativar" : "Ativar"}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      {entities.length > 0 ? (
        <form action={createAccount} className="auth-form">
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
          <label htmlFor="institution_name">Instituição</label>
          <input id="institution_name" name="institution_name" />
          <label htmlFor="account_type">Tipo</label>
          <select id="account_type" name="account_type" defaultValue="CHECKING">
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {accountTypeLabel(type)}
              </option>
            ))}
          </select>
          <label htmlFor="last_four">Últimos 4 dígitos</label>
          <input id="last_four" name="last_four" inputMode="numeric" />
          <button type="submit">Adicionar conta</button>
        </form>
      ) : null}
    </>
  );
}
