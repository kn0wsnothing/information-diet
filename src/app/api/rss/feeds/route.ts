import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const feedUrl = url.searchParams.get('url');

  if (!feedUrl) {
    return NextResponse.json({ error: 'Feed URL required' }, { status: 400 });
  }

  try {
    const { validateRSSFeed } = await import('@/lib/rss');
    
    const validation = await validateRSSFeed(feedUrl);
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      feedTitle: validation.feedTitle,
    });
  } catch (error) {
    console.error('Feed validation error:', error);
    return NextResponse.json(
      { error: 'Unable to validate RSS feed' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const feedUrl = body.url;

    if (!feedUrl) {
      return NextResponse.json({ error: 'Feed URL required' }, { status: 400 });
    }

    const { validateRSSFeed } = await import('@/lib/rss');
    
    const validation = await validateRSSFeed(feedUrl);
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      feedTitle: validation.feedTitle,
    });
  } catch (error) {
    console.error('Feed validation error:', error);
    return NextResponse.json(
      { error: 'Unable to validate RSS feed' },
      { status: 500 }
    );
  }
}
