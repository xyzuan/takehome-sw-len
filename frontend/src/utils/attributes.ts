import type { AttributeRow } from "@/schemas/entity";

// Convert a backend attributes object to the FieldArray shape for the form.
export const attributesToRows = (attrs: Record<string, unknown> | null | undefined): AttributeRow[] => {
  if (!attrs) return [];
  return Object.entries(attrs).map(([key, value]) => ({
    key,
    value: value == null ? "" : String(value),
  }));
};

// Convert the FieldArray shape back to the backend attributes object.
// Rows with empty keys are dropped; later rows override earlier duplicate keys.
export const rowsToAttributes = (rows: AttributeRow[] | undefined): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (!rows) return out;
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    out[key] = row.value;
  }
  return out;
};
