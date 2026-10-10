export const accountTypes = ["CHECKING", "SAVINGS", "DIGITAL", "CASH", "OTHER"] as const;

export type AccountType = (typeof accountTypes)[number];

export type AccountInput = {
  entityId: string;
  accountType: AccountType;
  name: string;
  institutionName: string | null;
  lastFour: string | null;
};

function optionalText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLastFour(
  value: string | null | undefined,
): { ok: true; value: string | null } | { ok: false } {
  const raw = (value ?? "").trim();

  if (raw.length === 0) {
    return { ok: true, value: null };
  }

  const digits = raw.replace(/\D/g, "");
  if (!/^[0-9]{4}$/.test(digits)) {
    return { ok: false };
  }

  return { ok: true, value: digits };
}

export function normalizeAccountInput(input: {
  entityId: string;
  accountType: string;
  name: string;
  institutionName?: string | null;
  lastFour?: string | null;
}): { ok: true; value: AccountInput } | { ok: false; message: string } {
  const entityId = input.entityId.trim();
  if (!entityId) {
    return { ok: false, message: "Escolha a entidade." };
  }

  if (!accountTypes.includes(input.accountType as AccountType)) {
    return { ok: false, message: "Escolha o tipo da conta." };
  }

  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, message: "Informe o nome." };
  }

  const lastFour = normalizeLastFour(input.lastFour);
  if (!lastFour.ok) {
    return { ok: false, message: "Informe quatro dígitos ou deixe em branco." };
  }

  return {
    ok: true,
    value: {
      entityId,
      accountType: input.accountType as AccountType,
      name,
      institutionName: optionalText(input.institutionName),
      lastFour: lastFour.value,
    },
  };
}

export function accountTypeLabel(type: AccountType): string {
  switch (type) {
    case "CHECKING":
      return "Conta corrente";
    case "SAVINGS":
      return "Poupança";
    case "DIGITAL":
      return "Conta digital";
    case "CASH":
      return "Dinheiro";
    case "OTHER":
      return "Outra";
  }
}
