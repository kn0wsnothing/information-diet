import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { restartOnboarding } from "../onboarding/actions";
import { syncReadwise } from "./actions";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { synced?: string; error?: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  const readwiseSource = await prisma.source.findFirst({
    where: {
      userId: dbUser.id,
      type: "READWISE",
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <Link href="/app" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage your preferences and connections.
        </p>

        {/* Success/Error Messages */}
        {searchParams.synced && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✓ Synced {searchParams.synced} item{searchParams.synced !== "1" ? "s" : ""} from Readwise
          </div>
        )}
        {searchParams.error === "sync-failed" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Sync failed. Please check your connection and try again.
          </div>
        )}
        {searchParams.error === "no-readwise" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Please connect Readwise first.
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-900">Getting Started</h2>
            <div className="mt-4">
              <form action={async () => {
                "use server";
                await restartOnboarding();
              }}>
                <button
                  type="submit"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Restart onboarding tutorial →
                </button>
              </form>
              <p className="mt-2 text-xs text-zinc-500">
                Review the time investment framework and setup guide
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">Connections</h2>
            
            {/* Readwise */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Readwise Reader</div>
                  {readwiseSource && readwiseSource.readwiseToken ? (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Connected
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 mt-1">
                      Not connected
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {readwiseSource && readwiseSource.readwiseToken ? (
                    <>
                      <form action={syncReadwise}>
                        <button
                          type="submit"
                          className="text-xs rounded-full bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
                        >
                          Sync Now
                        </button>
                      </form>
                      <Link
                        href="/app/connect/readwise"
                        className="text-xs text-zinc-600 hover:text-zinc-900"
                      >
                        Update
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/app/connect/readwise"
                      className="text-xs rounded-full bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
                    >
                      Connect
                    </Link>
                  )}
                </div>
              </div>
              {readwiseSource && readwiseSource.readwiseToken && (
                <div className="text-xs text-zinc-500">
                  Token: {readwiseSource.readwiseToken.slice(0, 10)}...
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200">
              <div className="block text-sm text-zinc-400">
                RSS feeds (coming soon)
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-900">Preferences</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <div>Diet goals (coming soon)</div>
              <div>Notification settings (coming soon)</div>
              <div>Export data (coming soon)</div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-900">Account</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <div>Email: {user.emailAddresses?.[0]?.emailAddress}</div>
              <div className="text-zinc-400">Account settings (coming soon)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
