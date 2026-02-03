import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SignedOut>
        <div className="min-h-screen bg-zinc-50">
          <div className="mx-auto max-w-xl px-6 py-16">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Sign in required
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              You need to sign in to connect your sources and see your dashboard.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Go back
            </Link>
          </div>
        </div>
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </div>
  );
}
