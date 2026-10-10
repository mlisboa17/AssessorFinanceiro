export const categoryKinds = ["EXPENSE", "INCOME", "TRANSFER"] as const;

export type CategoryKind = (typeof categoryKinds)[number];

export type CategoryInput = {
  kind: CategoryKind;
  name: string;
  slug: string;
};

export function categorySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCategoryInput(input: {
  kind: string;
  name: string;
}): { ok: true; value: CategoryInput } | { ok: false; message: string } {
  if (!categoryKinds.includes(input.kind as CategoryKind)) {
    return { ok: false, message: "Escolha Despesa, Receita ou Transferência." };
  }

  const name = input.name.trim();
  const slug = categorySlug(name);
  if (name.length === 0 || slug.length === 0) {
    return { ok: false, message: "Informe o nome." };
  }

  return {
    ok: true,
    value: {
      kind: input.kind as CategoryKind,
      name,
      slug,
    },
  };
}

export function categoryKindLabel(kind: CategoryKind): string {
  switch (kind) {
    case "EXPENSE":
      return "Despesa";
    case "INCOME":
      return "Receita";
    case "TRANSFER":
      return "Transferência";
  }
}
