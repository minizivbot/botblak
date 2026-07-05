import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

/** Serve a stored screenshot — only to its owner (cookie sent by the <img>). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await ctx.params;
  const upload = await prisma.upload.findFirst({ where: { id, userId } });
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = Buffer.from(upload.data, "base64");
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": upload.mimeType,
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
