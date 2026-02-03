"use client";

interface ReadingSession {
  id: string;
  minutesSpent: number;
  pagesRead: number | null;
  date: Date;
}

interface ReadingHistoryProps {
  sessions: ReadingSession[];
  totalPages?: number | null;
}

export function ReadingHistory({ sessions, totalPages }: ReadingHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-zinc-500">
        No reading sessions logged yet.
      </div>
    );
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutesSpent, 0);
  const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="text-zinc-600 font-medium">Reading history</div>
        <div className="text-zinc-500">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} • 
          {totalMinutes >= 60 
            ? ` ${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`
            : ` ${totalMinutes}m`
          }
          {totalPagesRead && ` • ${totalPagesRead} pages`}
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sessions.map((session) => {
          const date = new Date(session.date);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });

          return (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
            >
              <div className="text-zinc-700">
                {formattedDate}
                <span className="text-zinc-400 ml-2">{formattedTime}</span>
              </div>
              <div className="text-zinc-600">
                {session.minutesSpent}m
                {session.pagesRead && ` • ${session.pagesRead} pages`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
