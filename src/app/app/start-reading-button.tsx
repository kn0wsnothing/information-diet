"use client";

import { useTransition } from "react";
import { startReading } from "./reading-actions";

export function StartReadingButton({
  itemId,
}: {
  itemId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleStartReading = () => {
    startTransition(async () => {
      await startReading(itemId);
    });
  };

  return (
    <button
      onClick={handleStartReading}
      disabled={isPending}
      className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {isPending ? "Starting..." : "Start reading"}
    </button>
  );
}
