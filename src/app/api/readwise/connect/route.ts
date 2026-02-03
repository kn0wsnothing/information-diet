import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return new NextResponse("Bad Request", { status: 400 });

  const token = parsed.data.token.trim();

  const authRes = await fetch("https://readwise.io/api/v2/auth/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
    cache: "no-store",
  });

  if (authRes.status !== 204) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
  });

  await prisma.source.upsert({
    where: {
      id: (await prisma.source.findFirst({
        where: { userId: dbUser.id, type: "READWISE" },
        select: { id: true },
      }))?.id ?? "__missing__",
    },
    update: { readwiseToken: token },
    create: {
      userId: dbUser.id,
      type: "READWISE",
      name: "Readwise Reader",
      readwiseToken: token,
    },
  }).catch(async () => {
    // If the upsert path fails because the id doesn't exist, fallback to update-or-create.
    const existing = await prisma.source.findFirst({
      where: { userId: dbUser.id, type: "READWISE" },
    });
    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: { readwiseToken: token },
      });
      return;
    }
    await prisma.source.create({
      data: {
        userId: dbUser.id,
        type: "READWISE",
        name: "Readwise Reader",
        readwiseToken: token,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
