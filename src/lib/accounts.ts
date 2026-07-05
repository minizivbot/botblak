import { prisma } from "./prisma";

/**
 * Every user should have at least one trading account. Users created before
 * the accounts feature get a "Main" account lazily, and any of their trades
 * without an account are attached to it.
 */
export async function ensureDefaultAccount(userId: string): Promise<void> {
  const count = await prisma.account.count({ where: { userId } });
  if (count > 0) return;
  const main = await prisma.account
    .create({ data: { userId, name: "Main" } })
    .catch(() => prisma.account.findFirst({ where: { userId } })); // concurrent request created it
  if (main) {
    await prisma.trade.updateMany({ where: { userId, accountId: null }, data: { accountId: main.id } });
  }
}
