import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function connectReadwise(formData: FormData) {
  "use server";

  const user = await currentUser();
  if (!user) redirect("/");

  const token = String(formData.get("token") ?? "").trim();
  
  console.log("Readwise connect - Token length:", token.length);
  
  if (!token) {
    console.log("Readwise connect - No token provided");
    redirect("/app/connect/readwise?error=missing");
  }

  const authRes = await fetch("https://readwise.io/api/v2/auth/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
    cache: "no-store",
  });

  if (authRes.status !== 204) {
    console.log("Readwise connect - Auth failed with status:", authRes.status);
    redirect("/app/connect/readwise?error=invalid");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  const existing = await prisma.source.findFirst({
    where: { userId: dbUser.id, type: "READWISE" },
    select: { id: true },
  });

  if (existing) {
    await prisma.source.update({
      where: { id: existing.id },
      data: { readwiseToken: token, name: "Readwise Reader" },
    });
  } else {
    await prisma.source.create({
      data: {
        userId: dbUser.id,
        type: "READWISE",
        name: "Readwise Reader",
        readwiseToken: token,
      },
    });
  }

  console.log("Readwise connect - Successfully saved token");
  redirect("/app/settings?connected=true");
}

export default async function ConnectReadwisePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Connect Readwise Reader
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Paste your Readwise Reader access token. We’ll use it to sync your reading list and
          track what you’ve finished.
        </p>

        {searchParams.error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            That token didn’t work. Double-check it and try again.
          </div>
        ) : null}

        <form action={connectReadwise} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900" htmlFor="token">
              Readwise token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              placeholder="Token ..."
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            Connect
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-500">
          You can revoke this token any time from your Readwise account.
        </p>
      </div>
    </div>
  );
}
