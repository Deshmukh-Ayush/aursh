import { z } from "zod";

// ---------------------------------------------------------------------------
// Robust Item Preprocessor (handles strings, objects with name/type/title)
// ---------------------------------------------------------------------------

function normalizeItemArray(val: unknown, defaultType: "scope" | "exclusion" | "payment") {
  if (!val) return [];

  const rawArray = Array.isArray(val) ? val : [val];

  return rawArray.map((item) => {
    if (typeof item === "string") {
      return {
        title: item,
        description:
          defaultType === "exclusion"
            ? "Excluded from project scope"
            : defaultType === "payment"
              ? "Payment milestone"
              : "Included in project scope",
      };
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const title = String(obj.title ?? obj.name ?? obj.type ?? "Item");
      const desc = obj.description
        ? String(obj.description)
        : obj.percentage !== undefined
          ? `${obj.percentage}% of project total`
          : obj.amount !== undefined
            ? `Amount: ${obj.amount}`
            : "Specified in contract";

      return { title, description: desc };
    }
    return { title: String(item), description: "" };
  });
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const scopeItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const exclusionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const revisionLimitSchema = z.object({
  title: z.string(),
  maxRevisions: z.number().int().min(0),
  description: z.string().optional(),
});

export const paymentTermSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// ---------------------------------------------------------------------------
// Top-level Contract Scope Schema with Robust Preprocessors
// ---------------------------------------------------------------------------

export const contractScopeSchema = z.object({
  scopeItems: z
    .preprocess((val) => normalizeItemArray(val, "scope"), z.array(scopeItemSchema))
    .default([]),

  exclusions: z
    .preprocess((val) => normalizeItemArray(val, "exclusion"), z.array(exclusionSchema))
    .default([]),

  revisionLimits: z
    .preprocess((val) => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.map((item) => {
          if (typeof item === "string") {
            const match = item.match(/\d+/);
            return {
              title: item,
              maxRevisions: match ? parseInt(match[0], 10) : 2,
              description: item,
            };
          }
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            const maxRev =
              typeof obj.maxRevisions === "number"
                ? obj.maxRevisions
                : typeof obj.limit === "number"
                  ? obj.limit
                  : typeof obj.count === "number"
                    ? obj.count
                    : 2;

            return {
              title: String(obj.title ?? obj.name ?? "Revision Limit"),
              maxRevisions: maxRev,
              description: obj.description ? String(obj.description) : undefined,
            };
          }
          return { title: "Revision Limit", maxRevisions: 2 };
        });
      }
      if (val && typeof val === "object") {
        return Object.entries(val as Record<string, unknown>).map(([key, num]) => ({
          title: key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim(),
          maxRevisions:
            typeof num === "number"
              ? num
              : parseInt(String(num)) || 2,
          description: `Maximum ${key} limit`,
        }));
      }
      return [];
    }, z.array(revisionLimitSchema))
    .default([]),

  paymentTerms: z
    .preprocess((val) => normalizeItemArray(val, "payment"), z.array(paymentTermSchema))
    .default([]),
});

export type ContractScope = z.infer<typeof contractScopeSchema>;

// ---------------------------------------------------------------------------
// Scope Creep Evaluation
// ---------------------------------------------------------------------------

export const scopeStatusValues = [
  "within_scope",
  "limit_reached",
  "scope_creep_alert",
] as const;

export type ScopeStatus = (typeof scopeStatusValues)[number];

export interface ScopeEvaluation {
  status: ScopeStatus;
  isScopeCreep: boolean;
  maxRevisions: number | null;
  currentRevision: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Addendum Generation Schema with Universal Normalizer
// ---------------------------------------------------------------------------

export const addendumLineItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
});

export const addendumSchema = z.preprocess((val) => {
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const title = String(
      obj.title ?? obj.addendum_id ?? obj.scope_of_work ?? "Change Order Addendum",
    );
    const summary = String(
      obj.summary ?? obj.justification ?? obj.scope_of_work ?? "Additional work requested beyond original scope.",
    );
    const additionalPrice =
      typeof obj.additionalPrice === "number"
        ? obj.additionalPrice
        : typeof obj.additional_cost === "number"
          ? obj.additional_cost
          : typeof obj.price === "number"
            ? obj.price
            : 5000;
    const currency = String(obj.currency ?? "INR");

    let rawLineItems: any[] = [];
    if (Array.isArray(obj.lineItems)) {
      rawLineItems = obj.lineItems;
    } else if (Array.isArray(obj.line_items)) {
      rawLineItems = obj.line_items;
    } else {
      rawLineItems = [
        {
          description: String(obj.scope_of_work ?? "Additional work"),
          amount: additionalPrice,
        },
      ];
    }

    return {
      title,
      summary,
      additionalPrice,
      currency,
      lineItems: rawLineItems.map((item) => ({
        description: String(
          typeof item === "string"
            ? item
            : item?.description ?? item?.name ?? "Additional line item",
        ),
        amount:
          typeof item === "object" && item && typeof item.amount === "number"
            ? item.amount
            : typeof item === "object" && item && typeof item.cost === "number"
              ? item.cost
              : additionalPrice,
      })),
    };
  }
  return val;
}, z.object({
  title: z.string(),
  summary: z.string(),
  additionalPrice: z.number(),
  currency: z.string().default("INR"),
  lineItems: z.array(addendumLineItemSchema).default([]),
}));

export type Addendum = z.infer<typeof addendumSchema>;
