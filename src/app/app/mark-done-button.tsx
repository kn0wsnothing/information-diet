"use client";

import { useState } from "react";
import { MarkDoneModal } from "./mark-done-modal";

export function MarkDoneButton({
  itemId,
  itemTitle,
  contentType,
  currentPage,
  totalPages,
  currentTimeSpent,
  estimatedMinutes,
  markAction,
}: {
  itemId: string;
  itemTitle: string;
  contentType: string;
  currentPage?: number;
  totalPages?: number;
  currentTimeSpent?: number;
  estimatedMinutes?: number;
  markAction: (id: string, timeSpent: number, finished?: boolean) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Mark done
      </button>

      {isOpen && (
        <MarkDoneModal
          itemId={itemId}
          itemTitle={itemTitle}
          contentType={contentType}
          currentPage={currentPage}
          totalPages={totalPages}
          currentTimeSpent={currentTimeSpent}
          estimatedMinutes={estimatedMinutes}
          markAction={markAction}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
