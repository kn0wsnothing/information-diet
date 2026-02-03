"use client";

import { Check, X, Undo } from "lucide-react";

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onUndo?: () => void;
  variant?: "success" | "error" | "info";
}

export function Toast({
  isOpen,
  onClose,
  message,
  onUndo,
  variant = "success",
}: ToastProps) {
  if (!isOpen) return null;

  const variantClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-zinc-50 border-zinc-200 text-zinc-800",
  };

  const icon = {
    success: <Check className="h-5 w-5" />,
    error: <X className="h-5 w-5" />,
    info: null,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${variantClasses[variant]}`}
      >
        {icon[variant]}
        <span className="text-sm flex-1">{message}</span>
        {onUndo && (
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <Undo className="h-3 w-3" />
            Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
