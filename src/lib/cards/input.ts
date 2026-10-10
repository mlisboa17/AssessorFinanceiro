export type CardInput = {
  entityId: string;
  name: string;
  issuerName: string | null;
  brand: string | null;
  lastFour: string;
};

function optionalText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCardInput(input: {
  entityId: string;
  name: string;
  issuerName?: string | null;
  brand?: string | null;
  lastFour?: string | null;
}): { ok: true; value: CardInput } | { ok: false; message: string } {
  const entityId = input.entityId.trim();
  if (!entityId) {
    return { ok: false, message: "Escolha a entidade." };
  }

  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, message: "Informe o nome." };
  }

  const digits = (input.lastFour ?? "").replace(/\D/g, "");
  if (!/^[0-9]{4}$/.test(digits)) {
    return { ok: false, message: "Informe os quatro últimos dígitos." };
  }

  return {
    ok: true,
    value: {
      entityId,
      name,
      issuerName: optionalText(input.issuerName),
      brand: optionalText(input.brand),
      lastFour: digits,
    },
  };
}
