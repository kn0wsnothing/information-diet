import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGoodreadsCSV, normalizeGoodreadsBook } from "@/lib/csv-parser";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const books = parseGoodreadsCSV(text);

    if (books.length === 0) {
      return NextResponse.json({ error: "No books found in CSV" }, { status: 400 });
    }

    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId },
    });

    let importedCount = 0;

    for (const book of books) {
      const normalised = normalizeGoodreadsBook(book);

      // Skip if book already exists
      const existingBook = await prisma.item.findFirst({
        where: {
          userId: dbUser.id,
          title: normalised.title,
          author: normalised.author,
        },
      });

      if (existingBook) continue;

      await prisma.item.create({
        data: {
          userId: dbUser.id,
          title: normalised.title,
          author: normalised.author,
          macro: "TIME_TESTED",
          status: normalised.status as any,
          // Book metadata
          totalPages: normalised.totalPages,
          isbn: normalised.isbn,
          publishedDate: normalised.publishedYear 
            ? new Date(normalised.publishedYear, 0, 1) 
            : null,
        },
      });

      importedCount++;
    }

    return NextResponse.json({ 
      ok: true,
      imported: importedCount,
      total: books.length,
    });
  } catch (error) {
    console.error("Goodreads import error:", error);
    return NextResponse.json(
      { error: "Failed to import Goodreads data" },
      { status: 500 }
    );
  }
}
