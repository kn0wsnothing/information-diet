"use client";

interface DietData {
  snackMinutes: number;
  mealMinutes: number;
  timeTestedMinutes: number;
  totalMinutes: number;
}

export function DietChart({ data }: { data: DietData }) {
  const { snackMinutes, mealMinutes, timeTestedMinutes, totalMinutes } = data;
  
  if (totalMinutes === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-zinc-500">No data</div>
              <div className="text-xs text-zinc-400">7 days</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const snackPercent = (snackMinutes / totalMinutes) * 100;
  const mealPercent = (mealMinutes / totalMinutes) * 100;
  const timeTestedPercent = (timeTestedMinutes / totalMinutes) * 100;

  const circumference = 2 * Math.PI * 56;
  const snackLength = (snackPercent / 100) * circumference;
  const mealLength = (mealPercent / 100) * circumference;
  const timeTestedLength = (timeTestedPercent / 100) * circumference;

  let previousLength = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#e5e7eb"
            strokeWidth="16"
            fill="none"
          />
          
          {/* Snacks segment */}
          {snackMinutes > 0 && (
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#fb923c"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${snackLength} ${circumference}`}
              strokeDashoffset={-previousLength}
            />
          )}
          {previousLength += snackLength}
          
          {/* Meals segment */}
          {mealMinutes > 0 && (
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#3b82f6"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${mealLength} ${circumference}`}
              strokeDashoffset={-previousLength}
            />
          )}
          {previousLength += mealLength}
          
          {/* Time-tested segment */}
          {timeTestedMinutes > 0 && (
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#10b981"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${timeTestedLength} ${circumference}`}
              strokeDashoffset={-previousLength}
            />
          )}
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium text-zinc-900">
              {totalMinutes >= 60 
                ? `${Math.round(totalMinutes / 60)}h`
                : `${totalMinutes}m`
              }
            </div>
            <div className="text-xs text-zinc-500">7 days</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 space-y-1 text-xs">
        {snackMinutes > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-zinc-600">Bite-sized {snackPercent.toFixed(0)}%</span>
          </div>
        )}
        {mealMinutes > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-zinc-600">Thoughtful {mealPercent.toFixed(0)}%</span>
          </div>
        )}
        {timeTestedMinutes > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-zinc-600">Time-tested {timeTestedPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
