// Enhanced auto-categorization logic for different content types
export interface CategorizationScore {
  sprint: number;
  session: number;
  journey: number;
}

function calculateScores(url: string, title?: string): CategorizationScore {
  const scores: CategorizationScore = { sprint: 0, session: 0, journey: 0 };
  const domain = new URL(url).hostname.toLowerCase();
  const titleLower = (title || "").toLowerCase();

  // Social media and quick content (SPRINT)
  if (domain.includes("twitter.com") || domain.includes("x.com")) { scores.sprint += 10; }
  if (domain.includes("linkedin.com")) { scores.sprint += 8; }
  if (domain.includes("reddit.com")) { scores.sprint += 6; }
  if (domain.includes("news.ycombinator.com") || domain.includes("hackernews")) { scores.sprint += 7; }
  if (domain.includes("producthunt.com")) { scores.sprint += 9; }
  
  // Video platforms (SPRINT)
  if (domain.includes("youtube.com") || domain.includes("youtu.be")) { scores.sprint += 8; }
  if (domain.includes("vimeo.com")) { scores.sprint += 6; }
  if (domain.includes("tiktok.com")) { scores.sprint += 10; }
  
  // News sites (tend to be quick reads - SPRINT)
  if (domain.includes("cnn.com") || domain.includes("bbc.com") || domain.includes("reuters.com")) { scores.sprint += 6; }
  if (domain.includes("theguardian.com") || domain.includes("nytimes.com")) { scores.sprint += 5; scores.session += 2; }
  if (domain.includes("washingtonpost.com") || domain.includes("wsj.com")) { scores.sprint += 6; }
  
  // Tech news (usually quick - SPRINT)
  if (domain.includes("techcrunch.com") || domain.includes("theverge.com")) { scores.sprint += 6; }
  if (domain.includes("arstechnica.com")) { scores.sprint += 5; scores.session += 3; }
  if (domain.includes("engadget.com")) { scores.sprint += 7; }
  
  // Newsletter platforms (thoughtful reads - SESSION)
  if (domain.includes("substack.com")) { scores.session += 8; scores.journey += 1; }
  if (domain.includes("medium.com")) { scores.session += 7; }
  if (domain.includes("ghost.io")) { scores.session += 6; }
  if (domain.includes("beehiiv.com")) { scores.session += 6; scores.sprint += 1; }
  
  // Long-form content (SESSION/JOURNEY)
  if (domain.includes("longform.org")) { scores.session += 7; scores.journey += 2; }
  if (domain.includes("newyorker.com") || domain.includes("theatlantic.com")) { scores.session += 8; scores.journey += 1; }
  if (domain.includes("wired.com") || domain.includes("smithsonianmag.com")) { scores.session += 6; scores.journey += 1; }
  
  // Academic and research (JOURNEY)
  if (domain.includes("arxiv.org") || domain.includes("scholar.google.com")) { scores.journey += 10; }
  if (domain.includes("nature.com") || domain.includes("science.org")) { scores.journey += 9; }
  if (domain.includes("jstor.org") || domain.includes("researchgate.net")) { scores.journey += 8; }
  
  // Documentation and technical deep dives (JOURNEY/SESSION)
  if (domain.includes("docs.") || domain.includes("developer.")) { scores.journey += 7; scores.session += 2; }
  if (domain.includes("github.com") && url.includes("/blob/")) { scores.journey += 6; scores.sprint += 1; }
  
  // Books and reading platforms (JOURNEY)
  if (domain.includes("goodreads.com") || domain.includes("storygraph.com")) { scores.journey += 8; }
  if (domain.includes("amazon.com") && url.includes("/books/")) { scores.journey += 6; scores.session += 2; }
  if (domain.includes("gutenberg.org")) { scores.journey += 9; }
  
  // Blog platforms (check title length if available)
  if (domain.includes("blog") || domain.includes("wordpress.com") || domain.includes("tumblr.com")) {
    if (title && title.length > 80) { scores.session += 4; }
    else if (title) { scores.sprint += 4; }
    else { scores.session += 3; }
  }

  // Title analysis
  const words = titleLower.split(/\s+/).length;
  
  // Look for book indicators (JOURNEY)
  if (titleLower.includes("book") || 
      titleLower.includes("chapter") ||
      titleLower.includes("guide") ||
      titleLower.includes("manual") ||
      titleLower.includes("handbook") ||
      titleLower.includes("textbook") ||
      titleLower.includes("ebook")) {
    scores.journey += 7;
  }
  
  // Look for academic indicators (JOURNEY/SESSION)
  if (titleLower.includes("paper") || 
      titleLower.includes("study") ||
      titleLower.includes("research") ||
      titleLower.includes("analysis") ||
      titleLower.includes("journal")) {
    scores.journey += 5;
    scores.session += 2;
  }
  
  // Look for quick content indicators (SPRINT)
  if (titleLower.includes("quick") || 
      titleLower.includes("brief") ||
      titleLower.includes("summary") ||
      titleLower.includes("news") ||
      titleLower.includes("update") ||
      titleLower.includes("tip") ||
      titleLower.includes("hack") ||
      titleLower.includes("trick")) {
    scores.sprint += 6;
  }
  
  // Look for thoughtful content indicators (SESSION/JOURNEY)
  if (titleLower.includes("essay") || 
      titleLower.includes("deep dive") ||
      titleLower.includes("exploration") ||
      titleLower.includes("investigation") ||
      titleLower.includes("feature") ||
      titleLower.includes("profile") ||
      titleLower.includes("story")) {
    scores.session += 5;
    scores.journey += 2;
  }

  // Length-based scoring
  if (words <= 8) { scores.sprint += 3; }
  if (words >= 20) { scores.journey += 4; scores.session += 1; }
  if (words >= 30) { scores.journey += 6; scores.session += 2; }

  return scores;
}

export function inferContentTypeFromUrl(url: string, title?: string): "SPRINT" | "SESSION" | "JOURNEY" {
  const scores = calculateScores(url, title);
  
  // Find the highest score
  const maxScore = Math.max(scores.sprint, scores.session, scores.journey);
  
  // If there's a clear winner (>50% margin), use it
  if (maxScore > 0) {
    if (scores.journey >= maxScore) {
      // Require journey to be significantly higher than sprint
      if (scores.journey > scores.sprint * 1.2 || scores.journey > scores.session) {
        return "JOURNEY";
      }
    } else if (scores.session >= maxScore) {
      // Prefer session unless sprint is much higher
      if (scores.session > scores.sprint * 1.3) {
        return "SESSION";
      }
    } else if (scores.sprint >= maxScore) {
      return "SPRINT";
    }
  }
  
  // Fallback logic
  if (scores.journey > scores.sprint && scores.journey > scores.session) {
    return "JOURNEY";
  }
  if (scores.session > scores.sprint) {
    return "SESSION";
  }
  if (scores.sprint > 0) {
    return "SPRINT";
  }
  
  // Default to session for unknown content
  return "SESSION";
}

export function inferContentTypeFromTitle(title: string): "SPRINT" | "SESSION" | "JOURNEY" {
  const words = title.split(/\s+/).length;
  
  // Very short titles are likely sprints
  if (words <= 8) return "SPRINT";
  
  // Very long titles suggest deep content
  if (words >= 20) return "JOURNEY";
  
  // Look for book indicators
  if (title.toLowerCase().includes("book") || 
      title.toLowerCase().includes("chapter") ||
      title.toLowerCase().includes("guide") ||
      title.toLowerCase().includes("manual") ||
      title.toLowerCase().includes("handbook")) {
    return "JOURNEY";
  }
  
  // Look for quick content indicators
  if (title.toLowerCase().includes("quick") || 
      title.toLowerCase().includes("brief") ||
      title.toLowerCase().includes("summary") ||
      title.toLowerCase().includes("news") ||
      title.toLowerCase().includes("update")) {
    return "SPRINT";
  }
  
  // Look for thoughtful content indicators
  if (title.toLowerCase().includes("essay") || 
      title.toLowerCase().includes("analysis") ||
      title.toLowerCase().includes("deep dive") ||
      title.toLowerCase().includes("exploration") ||
      title.toLowerCase().includes("investigation")) {
    return "SESSION";
  }
  
  // Default based on word count
  if (words <= 12) return "SPRINT";
  if (words >= 15) return "JOURNEY";
  return "SESSION";
}
