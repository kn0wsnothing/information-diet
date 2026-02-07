"use client";

import { useState } from "react";
import Link from "next/link";
import { formatReadingTime } from "@/lib/time-estimation";

interface DietData {
  sprintMinutes: number;
  sessionMinutes: number;
  journeyMinutes: number;
  totalMinutes: number;
  sprintPercent: number;
  sessionPercent: number;
  journeyPercent: number;
  completedCount: number;
  items: Array<{
    id: string;
    title: string;
    contentType: string;
    timeSpent: number;
    completedAt: Date | null;
  }>;
}

interface AnalyticsData {
  periods: {
    "7": DietData;
    "14": DietData;
    "21": DietData;
  };
  currentStreak: number;
  currentlyReading: {
    books: number;
    articles: number;
  };
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const [timeRange, setTimeRange] = useState<"7" | "14" | "21">("7");
  const currentData = data.periods[timeRange];

  const getContentTypeLabel = (contentType: string) => {
    if (contentType === "SPRINT") return "⚡ Sprint";
    if (contentType === "SESSION") return "🎯 Session";
    return "🗺️ Journey";
  };

  const getRecommendation = (data: DietData) => {
    const { sprintPercent, sessionPercent, journeyPercent } = data;

    if (data.totalMinutes === 0) {
      return "Start tracking your reading to see personalized recommendations!";
    }

    if (sprintPercent > 60) {
      return "You've been doing a lot of quick Sprints. Consider adding more focused Sessions or deep Journeys to your routine.";
    }
    if (sessionPercent > 60 && journeyPercent < 20) {
      return "You have a solid routine of focused Sessions. Try to make room for more deep Journeys.";
    }
    if (journeyPercent > 60) {
      return "You're investing a lot in deep Journeys! Consider adding some variety with shorter, timely content.";
    }
    if (
      Math.abs(sprintPercent - 33) < 10 &&
      Math.abs(sessionPercent - 33) < 10 &&
      Math.abs(journeyPercent - 33) < 10
    ) {
      return "Great balance! Your time investment is well distributed across all content types.";
    }
    if (sprintPercent < 10) {
      return "Add some variety with quick Sprints to stay informed on timely topics.";
    }
    if (sessionPercent < 10) {
      return "Balance your reading with more focused Sessions for deeper exploration.";
    }
    if (journeyPercent < 10) {
      return "Make room for deep Journeys that provide lasting insights.";
    }
    return "Keep up your reading habits! Track your progress to maintain balance.";
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            Time Investment Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Track your reading patterns and time allocation over different types of content.
          </p>
        </div>

        {/* Time range selector */}
        <div className="mb-6 flex gap-2">
          {(["7", "14", "21"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {range} days
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {/* Time Distribution Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold text-zinc-900">
                Time Distribution - Last {timeRange} days
              </div>
              <div className="text-sm text-zinc-600">
                Total: {formatReadingTime(currentData.totalMinutes)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                <div className="text-3xl font-semibold text-orange-900">
                  {currentData.sprintPercent}%
                </div>
                <div className="mt-1 text-sm font-medium text-orange-700">⚡ Sprint</div>
                <div className="mt-2 text-xs text-orange-600">
                  {formatReadingTime(currentData.sprintMinutes)}
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="text-3xl font-semibold text-blue-900">
                  {currentData.sessionPercent}%
                </div>
                <div className="mt-1 text-sm font-medium text-blue-700">🎯 Session</div>
                <div className="mt-2 text-xs text-blue-600">
                  {formatReadingTime(currentData.sessionMinutes)}
                </div>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <div className="text-3xl font-semibold text-green-900">
                  {currentData.journeyPercent}%
                </div>
                <div className="mt-1 text-sm font-medium text-green-700">Time-tested</div>
                <div className="mt-2 text-xs text-green-600">
                  {formatReadingTime(currentData.journeyMinutes)}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-6 rounded-lg bg-zinc-50 border border-zinc-100 p-4">
              <div className="text-sm font-medium text-zinc-900 mb-2">
                💡 Recommendation
              </div>
              <div className="text-sm text-zinc-700">
                {getRecommendation(currentData)}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reading Streak */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-sm font-medium text-zinc-600">Reading Streak</div>
              <div className="mt-2 text-3xl font-semibold text-zinc-900">
                {data.currentStreak}
                <span className="text-lg text-zinc-500 ml-1">
                  {data.currentStreak === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {data.currentStreak > 0
                  ? "Keep it up! 🔥"
                  : "Start reading to build a streak"}
              </div>
            </div>

            {/* Currently Reading */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-sm font-medium text-zinc-600">Currently Reading</div>
              <div className="mt-2 space-y-1">
                <div className="text-lg font-semibold text-zinc-900">
                  {data.currentlyReading.books} {data.currentlyReading.books === 1 ? "book" : "books"}
                </div>
                <div className="text-sm text-zinc-600">
                  {data.currentlyReading.articles} {data.currentlyReading.articles === 1 ? "article" : "articles"}
                </div>
              </div>
            </div>

            {/* Completed This Period */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-sm font-medium text-zinc-600">
                Completed (last {timeRange} days)
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-900">
                {currentData.completedCount}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {currentData.completedCount > 0
                  ? `${Math.round(currentData.completedCount / parseInt(timeRange))} per day avg`
                  : "No items completed yet"}
              </div>
            </div>
          </div>

          {/* Trend Over Time */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-base font-semibold text-zinc-900 mb-4">
              Trend Over Time
            </div>
            <div className="space-y-3">
              {Object.entries(data.periods).map(([period, periodData]) => (
                <div key={period} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-zinc-600">{period} days</div>
                  <div className="flex-1 h-10 bg-zinc-100 rounded-lg overflow-hidden flex">
                    {periodData.sprintPercent > 0 && (
                      <div
                        className="bg-orange-400 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${periodData.sprintPercent}%` }}
                      >
                        {periodData.sprintPercent > 10 && `${periodData.sprintPercent}%`}
                      </div>
                    )}
                    {periodData.sessionPercent > 0 && (
                      <div
                        className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${periodData.sessionPercent}%` }}
                      >
                        {periodData.sessionPercent > 10 && `${periodData.sessionPercent}%`}
                      </div>
                    )}
                    {periodData.journeyPercent > 0 && (
                      <div
                        className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${periodData.journeyPercent}%` }}
                      >
                        {periodData.journeyPercent > 10 && `${periodData.journeyPercent}%`}
                      </div>
                    )}
                  </div>
                  <div className="w-24 text-sm text-zinc-600 text-right">
                    {formatReadingTime(periodData.totalMinutes)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Averages */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-base font-semibold text-zinc-900 mb-4">
              Daily Averages (last {timeRange} days)
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-zinc-600">⚡ Sprint</div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {formatReadingTime(Math.round(currentData.sprintMinutes / parseInt(timeRange)))}
                  <span className="text-sm text-zinc-500 font-normal">/day</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-600">🎯 Session</div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {formatReadingTime(Math.round(currentData.sessionMinutes / parseInt(timeRange)))}
                  <span className="text-sm text-zinc-500 font-normal">/day</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-600">Time-tested</div>
                <div className="mt-2 text-lg font-semibold text-zinc-900">
                  {formatReadingTime(Math.round(currentData.journeyMinutes / parseInt(timeRange)))}
                  <span className="text-sm text-zinc-500 font-normal">/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Completed Items */}
          {currentData.items.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="text-base font-semibold text-zinc-900 mb-4">
                Recently Completed
              </div>
              <div className="space-y-2">
                {currentData.items.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {getContentTypeLabel(item.contentType)} • {formatReadingTime(item.timeSpent)}
                        {item.completedAt &&
                          ` • ${new Date(item.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
