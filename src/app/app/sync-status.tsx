"use client";

import { useState, useCallback } from "react";
import { RotateCcw, AlertCircle } from "lucide-react";

interface SyncStatusProps {
  lastSyncAt: Date | null;
  isConnected: boolean;
  onSync?: () => Promise<void>;
}

export function SyncStatus({
  lastSyncAt,
  isConnected,
  onSync,
}: SyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);

  const handleSync = useCallback(async () => {
    if (!onSync || isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await onSync();
      // Clear error on successful sync
      setLastErrorTime(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Sync failed";
      setSyncError(errorMsg);
      setLastErrorTime(new Date());
      console.error("[SyncStatus] Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [onSync, isSyncing]);

  if (!isConnected) {
    return null;
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const showError =
    syncError && lastErrorTime && Date.now() - lastErrorTime.getTime() < 10000;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1 text-xs ${showError ? "text-red-500" : "text-zinc-500"}`}
      >
        {showError ? (
          <>
            <AlertCircle size={12} />
            <span className="max-w-xs truncate">{syncError}</span>
          </>
        ) : (
          <>
            <span>
              {lastSyncAt
                ? `Last synced: ${getTimeAgo(lastSyncAt)}`
                : "Not synced yet"}
            </span>
            {onSync && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync Readwise progress"
              >
                <RotateCcw
                  size={12}
                  className={isSyncing ? "animate-spin" : ""}
                />
                <span className="text-xs">Sync</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
