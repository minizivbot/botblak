import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * AES-256-GCM encryption for per-user broker credentials stored in the DB.
 * The key derives from AUTH_SECRET — set it in production and don't change it,
 * or saved broker connections will need to be re-entered.
 */

function key(): Buffer {
  const secret = process.env.AUTH_SECRET || "tradezone-dev-secret-change-me";
  return scryptSync(secret, "tradezone-secretbox-v1", 32);
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const plain = Buffer.from(JSON.stringify(value), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

export function decryptJson<T>(box: string): T | null {
  try {
    const [ivB64, tagB64, dataB64] = box.split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as T;
  } catch {
    return null;
  }
}
