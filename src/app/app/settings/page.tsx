import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

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

        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium text-zinc-900">Connections</h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/app/connect/readwise"
                className="block text-sm text-zinc-600 hover:text-zinc-900"
              >
                Manage Readwise connection →
              </Link>
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
