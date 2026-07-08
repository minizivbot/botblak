import { z } from "zod";

export const tradeSchema = z
  .object({
    symbol: z
      .string()
      .trim()
      .min(1, "Symbol is required")
      .max(20, "Symbol is too long")
      .transform((s) => s.toUpperCase()),
    direction: z.enum(["LONG", "SHORT"]),
    entryPrice: z.coerce.number().positive("Entry price must be positive"),
    exitPrice: z.coerce.number().positive("Exit price must be positive").nullish(),
    size: z.coerce.number().positive("Size must be positive"),
    fees: z.coerce.number().min(0, "Fees cannot be negative").default(0),
    entryDate: z.coerce.date(),
    exitDate: z.coerce.date().nullish(),
    strategy: z.string().trim().max(50).nullish().transform((s) => s || null),
    concepts: z.string().trim().max(500).nullish().transform((s) => s || null),
    accountId: z.string().trim().max(50).nullish().transform((s) => s || null),
    notes: z.string().trim().max(5000).nullish().transform((s) => s || null),
    screenshotPath: z.string().max(500).nullish().transform((s) => s || null),
  })
  .refine((t) => !t.exitDate || t.exitDate >= t.entryDate, {
    message: "Exit date must be after entry date",
    path: ["exitDate"],
  })
  .refine((t) => (t.exitPrice == null) === (t.exitDate == null), {
    message: "Exit price and exit date must be provided together",
    path: ["exitPrice"],
  });

export const settingsSchema = z.object({
  startingBalance: z.coerce.number().min(0, "Starting balance cannot be negative"),
  currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code (e.g. USD)")
    .transform((s) => s.toUpperCase()),
  maxDailyLoss: z
    .union([z.coerce.number().positive("Daily loss limit must be positive"), z.literal(""), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  showOnLeaderboard: z.boolean().optional(),
  // Pro theme accent; empty string / null clears back to the default blue.
  accent: z
    .union([z.enum(["gold", "violet", "emerald", "rose", "ice"]), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username is too long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, and . _ - are allowed"),
});

export const importTradesSchema = z.object({
  source: z.enum(["csv", "alpaca"]).default("csv"),
  trades: z.array(tradeSchema.and(z.object({ externalId: z.string().max(200).nullish() }))).min(1).max(5000),
});

/** Turn a ZodError into a short human-readable message. */
export function zodMessage(err: z.ZodError): string {
  return err.issues
    .slice(0, 3)
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}
