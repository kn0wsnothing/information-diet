"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { DietChart } from "./diet-chart";

interface DietData {
  sprintMinutes: number;
  sessionMinutes: number;
  journeyMinutes: number;
  totalMinutes: number;
}

export function Sidebar({ 
  activeView, 
  setActiveView, 
  dietData,
  userEmail 
}: { 
  activeView: string;
  setActiveView: (view: string) => void;
  dietData: DietData;
  userEmail: string;
}) {
  const router = useRouter();

  const navItems = [
    { id: "suggestions", label: "Smart Suggestion", icon: "🎯" },
    { id: "feed", label: "All Items", icon: "📚" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "add", label: "Add Content", icon: "➕" },
    { id: "completed", label: "View Completed", icon: "✅" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-80 bg-white border-r border-zinc-200 p-6 flex flex-col h-screen">
      {/* User Info */}
      <div className="mb-6">
        <div className="text-sm font-medium text-zinc-900">{userEmail}</div>
        <SignOutButton>
          <button className="mt-1 text-xs text-zinc-500 hover:text-zinc-700">
            Sign out
          </button>
        </SignOutButton>
      </div>

      {/* Diet Chart */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/app/analytics")}
          className="w-full text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-900">Your diet (7 days)</h3>
            <span className="text-xs text-zinc-500 group-hover:text-zinc-700">View →</span>
          </div>
          <DietChart data={dietData} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "analytics") {
                  router.push("/app/analytics");
                } else if (item.id === "completed") {
                  router.push("/app/completed");
                } else if (item.id === "settings") {
                  router.push("/app/settings");
                } else if (item.id === "add") {
                  router.push("/app/add");
                } else {
                  setActiveView(item.id);
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id && item.id !== "analytics" && item.id !== "completed" && item.id !== "settings" && item.id !== "add"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-zinc-200">
        <div className="text-xs text-zinc-500">
          Information Diet v1.0
        </div>
      </div>
    </div>
  );
}
