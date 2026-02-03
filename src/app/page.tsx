import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-900">Information Diet</div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                href="/app"
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900"
              >
                Open app
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Get started
              </Link>
            </SignedOut>
          </div>
        </div>

        <h1 className="mt-12 text-4xl font-semibold tracking-tight text-zinc-900">
          Rebalance your information diet.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          Most of us are overweight on quick hits and underweight on durable, time-tested ideas.
          This app gives gentle suggestions to trade snacks for meals and make room for books—without
          obsessing over timers.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/app"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Go to dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
