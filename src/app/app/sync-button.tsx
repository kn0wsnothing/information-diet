"use client";

import { useTransition } from "react";

export function SyncButton({ syncAction }: { syncAction: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => syncAction())}
      disabled={isPending}
      className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {isPending ? "Syncing..." : "Sync now"}
    </button>
  );
}
