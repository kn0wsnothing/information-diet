"use client";

import { useState } from "react";
import { useTransition } from "react";

export function RecategorizeButton({
  itemId,
  currentMacro,
  recategorizeAction,
}: {
  itemId: string;
  currentMacro: string;
  recategorizeAction: (id: string, newMacro: string) => Promise<void>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categories = [
    { value: "SNACK", label: "Bite-sized" },
    { value: "MEAL", label: "Thoughtful" },
    { value: "TIME_TESTED", label: "Time-tested" },
  ];

  const handleRecategorize = (newMacro: string) => {
    startTransition(async () => {
      await recategorizeAction(itemId, newMacro);
      setShowMenu(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
        className="text-xs font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
      >
        ↻
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg z-10">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleRecategorize(cat.value)}
              disabled={isPending || cat.value === currentMacro}
              className="block w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-default"
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
