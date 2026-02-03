"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/confirm-modal";
import { Trash2 } from "lucide-react";

interface RemoveButtonProps {
  itemId: string;
  removeAction: (itemId: string) => Promise<void>;
  undoAction?: (itemId: string) => Promise<void>;
}

export function RemoveButton({ itemId, removeAction, undoAction }: RemoveButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removedItemId, setRemovedItemId] = useState<string | null>(null);

  const handleRemove = async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      await removeAction(itemId);
      setRemovedItemId(itemId);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Failed to remove item:", error);
      setIsRemoving(false);
    }
  };

  const handleUndo = async () => {
    if (undoAction && removedItemId) {
      try {
        await undoAction(removedItemId);
        setRemovedItemId(null);
        setIsRemoving(false);
      } catch (error) {
        console.error("Failed to undo removal:", error);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isRemoving}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
          isRemoving
            ? "text-zinc-400 bg-zinc-100"
            : "text-zinc-500 hover:text-red-600 hover:bg-red-50"
        }`}
      >
        <Trash2 className="h-3 w-3" />
        {isRemoving ? "Removed" : "Remove"}
      </button>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRemove}
        title="Remove this item?"
        message="This will remove the item from your queue. This action can be undone."
        confirmText="Remove it"
        cancelText="Cancel"
        variant="danger"
      />

      {removedItemId && undoAction && (
        <button
          onClick={handleUndo}
          className="text-xs px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Undo
        </button>
      )}
    </>
  );
}
