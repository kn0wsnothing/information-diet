"use client";

import { useState } from "react";
import { UpdateProgressModal } from "./update-progress-modal";
import { logReadingSession } from "./reading-actions";

export function UpdateProgressButton({
  itemId,
  itemTitle,
  currentPage,
  totalPages,
  currentTimeSpent,
}: {
  itemId: string;
  itemTitle: string;
  currentPage: number;
  totalPages: number;
  currentTimeSpent: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Update progress
      </button>

      {isOpen && (
        <UpdateProgressModal
          itemId={itemId}
          itemTitle={itemTitle}
          currentPage={currentPage}
          totalPages={totalPages}
          currentTimeSpent={currentTimeSpent}
          updateAction={logReadingSession}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
