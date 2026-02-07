"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

interface SyncStatusProps {
  lastSyncAt: Date | null;
  isConnected: boolean;
  onSync?: () => Promise<void>;
}

export function SyncStatus({ lastSyncAt, isConnected, onSync }: SyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!onSync) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      await onSync();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

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

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <span>
        {lastSyncAt ? `Last synced: ${getTimeAgo(lastSyncAt)}` : "Not synced yet"}
      </span>
      {onSync && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sync Readwise progress"
        >
          <RotateCcw size={12} className={isSyncing ? "animate-spin" : ""} />
          <span className="text-xs">Sync</span>
        </button>
      )}
      {syncError && <span className="text-red-500">Error: {syncError}</span>}
    </div>
  );
}
