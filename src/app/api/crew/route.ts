import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { zodMessage } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

const createSchema = z.object({
  name: z.string().trim().min(2, "Give the crew a name").max(30, "Name is too long"),
});

/** Unambiguous invite code (no 0/O/1/I). */
function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...randomBytes(6)].map((b) => alphabet[b % alphabet.length]).join("");
}

/** Create a crew (you become its owner and first member). */
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rl = rateLimit(`crew:${userId}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Slow down — try again in ${rl.retryAfter}s` }, { status: 429 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  const existing = await prisma.crewMember.findUnique({ where: { userId } });
  if (existing) return NextResponse.json({ error: "You're already in a crew — leave it first" }, { status: 409 });

  const crew = await prisma.crew.create({
    data: {
      name: parsed.data.name,
      code: inviteCode(),
      ownerId: userId,
      members: { create: { userId } },
    },
  });
  return NextResponse.json({ crew: { id: crew.id, name: crew.name, code: crew.code } }, { status: 201 });
}
