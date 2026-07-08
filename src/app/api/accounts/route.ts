import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { FREE_ACCOUNT_LIMIT, isProUser } from "@/lib/plan";

const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required").max(40, "Name is too long"),
  isCopy: z.boolean().default(false),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { trades: true } } },
  });
  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      isCopy: a.isCopy,
      tradeCount: a._count.trades,
      propStartBalance: a.propStartBalance,
      propProfitTarget: a.propProfitTarget,
      propMaxDrawdown: a.propMaxDrawdown,
      propDrawdownType: a.propDrawdownType,
      propMaxDailyLoss: a.propMaxDailyLoss,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = accountSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

    const exists = await prisma.account.findUnique({
      where: { userId_name: { userId, name: parsed.data.name } },
    });
    if (exists) return NextResponse.json({ error: "You already have an account with that name" }, { status: 409 });

    // Free plan: up to FREE_ACCOUNT_LIMIT accounts (existing extras are kept, just no new ones).
    const count = await prisma.account.count({ where: { userId } });
    if (count >= FREE_ACCOUNT_LIMIT && !(await isProUser(userId))) {
      return NextResponse.json(
        { error: `The free plan includes ${FREE_ACCOUNT_LIMIT} accounts — upgrade to Pro for unlimited accounts` },
        { status: 403 },
      );
    }

    const account = await prisma.account.create({ data: { ...parsed.data, userId } });
    return NextResponse.json({ account }, { status: 201 });
  } catch (e) {
    console.error("POST /api/accounts failed:", e);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
