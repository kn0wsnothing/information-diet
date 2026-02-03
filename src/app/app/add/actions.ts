"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { inferMacroFromUrl, inferMacroFromTitle } from "@/lib/auto-categorize";
import { estimateTimeFromPages } from "@/lib/time-estimation";
import { mapMacroToContentType } from "@/lib/content-types";

export async function addLink(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!url) {
    redirect("/app/add?error=url");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  const itemTitle = title || new URL(url).hostname || "Untitled";
  
  // Auto-categorize based on URL and title
  const macroFromUrl = inferMacroFromUrl(url, itemTitle);
  const macroFromTitle = title ? inferMacroFromTitle(title) : "MEAL";
  
  // Use URL categorization as primary, title as fallback
  const macro = macroFromUrl !== "MEAL" ? macroFromUrl : macroFromTitle;
  const contentType = mapMacroToContentType(macro);

  await prisma.item.create({
    data: {
      userId: dbUser.id,
      title: itemTitle,
      url,
      macro,
      contentType,
      status: "QUEUED",
    },
  });

  redirect("/app");
}

export async function addBook(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const openLibraryId = String(formData.get("openLibraryId") ?? "").trim();
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  const totalPages = formData.get("totalPages") ? parseInt(String(formData.get("totalPages"))) : null;
  const isbn = String(formData.get("isbn") ?? "").trim();
  const publishedYear = formData.get("publishedYear") ? parseInt(String(formData.get("publishedYear"))) : null;

  if (!title) {
    redirect("/app/add?error=title");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  // Calculate estimated reading time from pages
  const estimatedMinutes = totalPages ? estimateTimeFromPages(totalPages) : null;

  await prisma.item.create({
    data: {
      userId: dbUser.id,
      title,
      author: author || null,
      macro: "TIME_TESTED",
      contentType: "JOURNEY", // Books are always journeys
      status: "QUEUED",
      // Open Library metadata
      coverUrl: coverUrl || null,
      openLibraryId: openLibraryId || null,
      totalPages,
      isbn: isbn || null,
      publishedDate: publishedYear ? new Date(publishedYear, 0, 1) : null,
      estimatedMinutes,
      progressMode: "pages", // Default to page-based tracking for books
    },
  });

  redirect("/app");
}

export async function addNewsletter(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!title) {
    redirect("/app/add?error=title");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: { clerkId: user.id },
  });

  await prisma.item.create({
    data: {
      userId: dbUser.id,
      title,
      url: url || null,
      macro: "MEAL",
      contentType: "SESSION", // Newsletters are typically sessions
      status: "QUEUED",
    },
  });

  redirect("/app");
}

export async function addRSSFeed(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const feedUrl = String(formData.get("feedUrl") ?? "").trim();
  const feedName = String(formData.get("feedName") ?? "").trim();

  if (!feedUrl) {
    redirect("/app/add?error=url");
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rss/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feedUrl,
        name: feedName || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      redirect(`/app/add?error=${encodeURIComponent(result.error || 'Failed to connect RSS feed')}`);
    }

    redirect("/app");
  } catch (error) {
    console.error("Failed to connect RSS feed:", error);
    redirect("/app/add?error=connection_failed");
  }
}

export async function syncRSSFeed(feedId?: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rss/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Sync failed" };
    }

    return { success: true, itemsAdded: result.itemsAdded };
  } catch (error) {
    console.error("Failed to sync RSS feed:", error);
    return { success: false, error: "Sync failed" };
  }
}
