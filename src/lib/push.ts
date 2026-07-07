import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;
function ensureConfigured(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails("mailto:support@tradezone.app", pub, priv);
    configured = true;
  }
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Send a push notification to every device the user has subscribed on. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (e: unknown) {
        // 404/410 means the subscription is dead (uninstalled, expired) — clean it up.
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
        } else {
          console.error("push send failed:", e);
        }
      }
    }),
  );
}

/** Send a push notification to every subscribed user (site-wide announcements). */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] });
  await Promise.all(subs.map((s) => sendPushToUser(s.userId, payload)));
}
