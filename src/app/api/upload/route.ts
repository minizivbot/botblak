import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Screenshots are stored base64 in the DB (not the filesystem) so they persist
// on serverless hosting. Kept small to keep rows reasonable.
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED: Record<string, { magic: number[] }> = {
  "image/png": { magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { magic: [0xff, 0xd8, 0xff] },
  "image/webp": { magic: [0x52, 0x49, 0x46, 0x46] },
  "image/gif": { magic: [0x47, 0x49, 0x46, 0x38] },
};

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const rl = rateLimit(`upload:${clientIp(req)}`, 30, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many uploads, slow down." }, { status: 429 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const spec = ALLOWED[file.type];
    if (!spec) {
      return NextResponse.json({ error: "Only PNG, JPEG, WebP or GIF images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // Reject files whose real content doesn't match the claimed image type.
    if (!spec.magic.every((b, i) => bytes[i] === b)) {
      return NextResponse.json({ error: "That file isn't a valid image" }, { status: 400 });
    }

    const upload = await prisma.upload.create({
      data: { userId, mimeType: file.type, data: bytes.toString("base64") },
      select: { id: true },
    });
    return NextResponse.json({ path: `/api/uploads/${upload.id}` }, { status: 201 });
  } catch (e) {
    console.error("POST /api/upload failed:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
