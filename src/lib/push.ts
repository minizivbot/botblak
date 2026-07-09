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

/** Per-type push preference columns on Settings. */
export type NotifyPref = "notifyMorning" | "notifyDaily" | "notifyWeekly" | "notifyAlerts";

/** True unless the user has explicitly turned this notification type off. */
export async function wantsPush(userId: string, pref: NotifyPref): Promise<boolean> {
  const s = await prisma.settings.findUnique({ where: { userId }, select: { [pref]: true } });
  // No settings row (or column true) => opted in by default.
  return s ? (s as Record<string, boolean>)[pref] !== false : true;
}

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

/**
 * Send to every subscribed user who hasn't opted out of `pref`.
 * Used for site-wide announcements (respect "notifyAlerts") and the morning
 * briefing (respect "notifyMorning").
 */
export async function sendPushToAll(payload: PushPayload, pref: NotifyPref = "notifyAlerts"): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] });
  await Promise.all(
    subs.map(async (s) => {
      if (await wantsPush(s.userId, pref)) await sendPushToUser(s.userId, payload);
    }),
  );
}
