"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/card";

interface CompletedItem {
  id: string;
  title: string;
  url: string | null;
  macro: "SNACK" | "MEAL" | "TIME_TESTED";
  completedAt: Date | null;
  timeSpentMinutes: number | null;
}

interface DietBreakdown {
  snackMinutes: number;
  mealMinutes: number;
  timeTestedMinutes: number;
  totalMinutes: number;
  snackPercent: number;
  mealPercent: number;
  timeTestedPercent: number;
}

interface DietHistory {
  period: string;
  breakdown: DietBreakdown;
  items: CompletedItem[];
}

export default function CompletedPage() {
  const [timeRange, setTimeRange] = useState<"7" | "14" | "21">("7");
  const [history, setHistory] = useState<DietHistory[]>([]);

  // Mock data for demonstration - in real app, this would come from API
  const mockHistory: DietHistory[] = [
    {
      period: "7 days",
      breakdown: {
        snackMinutes: 45,
        mealMinutes: 90,
        timeTestedMinutes: 135,
        totalMinutes: 270,
        snackPercent: 17,
        mealPercent: 33,
        timeTestedPercent: 50,
      },
      items: [],
    },
    {
      period: "14 days",
      breakdown: {
        snackMinutes: 90,
        mealMinutes: 180,
        timeTestedMinutes: 270,
        totalMinutes: 540,
        snackPercent: 17,
        mealPercent: 33,
        timeTestedPercent: 50,
      },
      items: [],
    },
    {
      period: "21 days",
      breakdown: {
        snackMinutes: 135,
        mealMinutes: 270,
        timeTestedMinutes: 405,
        totalMinutes: 810,
        snackPercent: 17,
        mealPercent: 33,
        timeTestedPercent: 50,
      },
      items: [],
    },
  ];

  const currentData = mockHistory.find((h) => h.period === `${timeRange} days`)?.breakdown || mockHistory[0].breakdown;

  const getMacroLabel = (macro: string) => {
    if (macro === "SNACK") return "Bite-sized";
    if (macro === "MEAL") return "Thoughtful";
    return "Time-tested";
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <Link href="/app" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to queue
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Completed items
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Track your reading patterns and diet balance over time.
        </p>

        {/* Time range selector */}
        <div className="mt-6 flex gap-2">
          {(["7", "14", "21"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {range} days
            </button>
          ))}
        </div>

        {/* Diet breakdown card */}
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-900">
              Last {timeRange} days - Diet breakdown
            </div>
            <div className="text-xs text-zinc-600">
              Total: {formatTime(currentData.totalMinutes)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
              <div className="text-2xl font-semibold text-orange-900">
                {currentData.snackPercent}%
              </div>
              <div className="mt-1 text-xs text-orange-700">Bite-sized</div>
              <div className="mt-2 text-xs text-orange-600">
                {formatTime(currentData.snackMinutes)}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="text-2xl font-semibold text-blue-900">
                {currentData.mealPercent}%
              </div>
              <div className="mt-1 text-xs text-blue-700">Thoughtful</div>
              <div className="mt-2 text-xs text-blue-600">
                {formatTime(currentData.mealMinutes)}
              </div>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              <div className="text-2xl font-semibold text-green-900">
                {currentData.timeTestedPercent}%
              </div>
              <div className="mt-1 text-xs text-green-700">Time-tested</div>
              <div className="mt-2 text-xs text-green-600">
                {formatTime(currentData.timeTestedMinutes)}
              </div>
            </div>
          </div>

          {/* Recommendation based on diet */}
          <div className="mt-6 rounded-lg bg-zinc-50 p-4">
            <div className="text-sm font-medium text-zinc-900 mb-2">
              Recommendation
            </div>
            <div className="text-sm text-zinc-700">
              {currentData.snackPercent > 50 && (
                "You've been snacking a lot. Consider adding more thoughtful reads or time-tested books to your diet."
              )}
              {currentData.mealPercent > 50 && currentData.timeTestedPercent < 20 && (
                "You have a solid diet of thoughtful reads. Try to make room for more time-tested content."
              )}
              {currentData.timeTestedPercent > 60 && (
                "You're reading a lot of books! Consider adding some variety with shorter content."
              )}
              {Math.abs(currentData.snackPercent - 33) < 10 &&
               Math.abs(currentData.mealPercent - 33) < 10 &&
               Math.abs(currentData.timeTestedPercent - 33) < 10 && (
                "Great balance! Your information diet is well distributed across all content types."
              )}
            </div>
          </div>
        </Card>

        {/* Trend indicators */}
        <Card className="mt-6">
          <div className="text-sm font-medium text-zinc-900 mb-4">
            Trend over time
          </div>
          <div className="space-y-3">
            {mockHistory.map(({ period, breakdown }) => (
              <div key={period} className="flex items-center gap-4">
                <div className="w-24 text-xs text-zinc-600">{period}</div>
                <div className="flex-1 h-8 bg-zinc-100 rounded overflow-hidden flex">
                  <div
                    className="bg-orange-400"
                    style={{ width: `${breakdown.snackPercent}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${breakdown.mealPercent}%` }}
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${breakdown.timeTestedPercent}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-600 w-20 text-right">
                  {formatTime(breakdown.totalMinutes)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily averages */}
        <Card className="mt-6">
          <div className="text-sm font-medium text-zinc-900 mb-4">
            Daily averages (last {timeRange} days)
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-zinc-600">Bite-sized</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatTime(Math.round(currentData.snackMinutes / parseInt(timeRange)))}
                /day
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600">Thoughtful</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatTime(Math.round(currentData.mealMinutes / parseInt(timeRange)))}
                /day
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600">Time-tested</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatTime(Math.round(currentData.timeTestedMinutes / parseInt(timeRange)))}
                /day
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
