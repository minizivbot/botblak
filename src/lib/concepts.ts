import { ICT_CONCEPTS } from "./killzones";

/** Parse a user's stored concept list, falling back to the ICT defaults. */
export function parseConcepts(raw: string | null | undefined): string[] {
  if (!raw) return ICT_CONCEPTS;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((c): c is string => typeof c === "string") : ICT_CONCEPTS;
  } catch {
    return ICT_CONCEPTS;
  }
}
