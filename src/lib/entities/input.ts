export const entityTypes = ["PERSON", "COMPANY"] as const;

export type EntityType = (typeof entityTypes)[number];

export type EntityInput = {
  type: EntityType;
  name: string;
  documentNumber: string | null;
};

export function normalizeEntityInput(input: {
  type: string;
  name: string;
  documentNumber?: string | null;
}): { ok: true; value: EntityInput } | { ok: false; message: string } {
  if (!entityTypes.includes(input.type as EntityType)) {
    return { ok: false, message: "Escolha Pessoa Física ou Empresa." };
  }

  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, message: "Informe o nome." };
  }

  const digits = (input.documentNumber ?? "").replace(/\D/g, "");

  return {
    ok: true,
    value: {
      type: input.type as EntityType,
      name,
      documentNumber: digits.length > 0 ? digits : null,
    },
  };
}

export function entityTypeLabel(type: EntityType): string {
  return type === "PERSON" ? "Pessoa Física" : "Empresa";
}
