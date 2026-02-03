// Enhanced auto-categorization logic for different content types
export interface CategorizationScore {
  snack: number;
  meal: number;
  timeTested: number;
}

function calculateScores(url: string, title?: string): CategorizationScore {
  const scores: CategorizationScore = { snack: 0, meal: 0, timeTested: 0 };
  const domain = new URL(url).hostname.toLowerCase();
  const titleLower = (title || "").toLowerCase();

  // Social media and quick content
  if (domain.includes("twitter.com") || domain.includes("x.com")) { scores.snack += 10; }
  if (domain.includes("linkedin.com")) { scores.snack += 8; }
  if (domain.includes("reddit.com")) { scores.snack += 6; }
  if (domain.includes("news.ycombinator.com") || domain.includes("hackernews")) { scores.snack += 7; }
  if (domain.includes("producthunt.com")) { scores.snack += 9; }
  
  // Video platforms
  if (domain.includes("youtube.com") || domain.includes("youtu.be")) { scores.snack += 8; }
  if (domain.includes("vimeo.com")) { scores.snack += 6; }
  if (domain.includes("tiktok.com")) { scores.snack += 10; }
  
  // News sites (tend to be quick reads)
  if (domain.includes("cnn.com") || domain.includes("bbc.com") || domain.includes("reuters.com")) { scores.snack += 6; }
  if (domain.includes("theguardian.com") || domain.includes("nytimes.com")) { scores.snack += 5; scores.meal += 2; }
  if (domain.includes("washingtonpost.com") || domain.includes("wsj.com")) { scores.snack += 6; }
  
  // Tech news (usually quick)
  if (domain.includes("techcrunch.com") || domain.includes("theverge.com")) { scores.snack += 6; }
  if (domain.includes("arstechnica.com")) { scores.snack += 5; scores.meal += 3; }
  if (domain.includes("engadget.com")) { scores.snack += 7; }
  
  // Newsletter platforms (thoughtful reads)
  if (domain.includes("substack.com")) { scores.meal += 8; scores.timeTested += 1; }
  if (domain.includes("medium.com")) { scores.meal += 7; }
  if (domain.includes("ghost.io")) { scores.meal += 6; }
  if (domain.includes("beehiiv.com")) { scores.meal += 6; scores.snack += 1; }
  
  // Long-form content
  if (domain.includes("longform.org")) { scores.meal += 7; scores.timeTested += 2; }
  if (domain.includes("newyorker.com") || domain.includes("theatlantic.com")) { scores.meal += 8; scores.timeTested += 1; }
  if (domain.includes("wired.com") || domain.includes("smithsonianmag.com")) { scores.meal += 6; scores.timeTested += 1; }
  
  // Academic and research
  if (domain.includes("arxiv.org") || domain.includes("scholar.google.com")) { scores.timeTested += 10; }
  if (domain.includes("nature.com") || domain.includes("science.org")) { scores.timeTested += 9; }
  if (domain.includes("jstor.org") || domain.includes("researchgate.net")) { scores.timeTested += 8; }
  
  // Documentation and technical deep dives
  if (domain.includes("docs.") || domain.includes("developer.")) { scores.timeTested += 7; scores.meal += 2; }
  if (domain.includes("github.com") && url.includes("/blob/")) { scores.timeTested += 6; scores.snack += 1; }
  
  // Books and reading platforms
  if (domain.includes("goodreads.com") || domain.includes("storygraph.com")) { scores.timeTested += 8; }
  if (domain.includes("amazon.com") && url.includes("/books/")) { scores.timeTested += 6; scores.meal += 2; }
  if (domain.includes("gutenberg.org")) { scores.timeTested += 9; }
  
  // Blog platforms (check title length if available)
  if (domain.includes("blog") || domain.includes("wordpress.com") || domain.includes("tumblr.com")) {
    if (title && title.length > 80) { scores.meal += 4; }
    else if (title) { scores.snack += 4; }
    else { scores.meal += 3; }
  }

  // Title analysis
  const words = titleLower.split(/\s+/).length;
  
  // Look for book indicators
  if (titleLower.includes("book") || 
      titleLower.includes("chapter") ||
      titleLower.includes("guide") ||
      titleLower.includes("manual") ||
      titleLower.includes("handbook") ||
      titleLower.includes("textbook") ||
      titleLower.includes("ebook")) {
    scores.timeTested += 7;
  }
  
  // Look for academic indicators
  if (titleLower.includes("paper") || 
      titleLower.includes("study") ||
      titleLower.includes("research") ||
      titleLower.includes("analysis") ||
      titleLower.includes("journal")) {
    scores.timeTested += 5;
    scores.meal += 2;
  }
  
  // Look for quick content indicators
  if (titleLower.includes("quick") || 
      titleLower.includes("brief") ||
      titleLower.includes("summary") ||
      titleLower.includes("news") ||
      titleLower.includes("update") ||
      titleLower.includes("tip") ||
      titleLower.includes("hack") ||
      titleLower.includes("trick")) {
    scores.snack += 6;
  }
  
  // Look for thoughtful content indicators
  if (titleLower.includes("essay") || 
      titleLower.includes("deep dive") ||
      titleLower.includes("exploration") ||
      titleLower.includes("investigation") ||
      titleLower.includes("feature") ||
      titleLower.includes("profile") ||
      titleLower.includes("story")) {
    scores.meal += 5;
    scores.timeTested += 2;
  }

  // Length-based scoring
  if (words <= 8) { scores.snack += 3; }
  if (words >= 20) { scores.timeTested += 4; scores.meal += 1; }
  if (words >= 30) { scores.timeTested += 6; scores.meal += 2; }

  return scores;
}

export function inferMacroFromUrl(url: string, title?: string): "SNACK" | "MEAL" | "TIME_TESTED" {
  const scores = calculateScores(url, title);
  
  // Find the highest score
  const maxScore = Math.max(scores.snack, scores.meal, scores.timeTested);
  
  // If there's a clear winner (>50% margin), use it
  if (maxScore > 0) {
    if (scores.timeTested >= maxScore) {
      // Require time-tested to be significantly higher than snack
      if (scores.timeTested > scores.snack * 1.2 || scores.timeTested > scores.meal) {
        return "TIME_TESTED";
      }
    } else if (scores.meal >= maxScore) {
      // Prefer meal unless snack is much higher
      if (scores.meal > scores.snack * 1.3) {
        return "MEAL";
      }
    } else if (scores.snack >= maxScore) {
      return "SNACK";
    }
  }
  
  // Fallback logic
  if (scores.timeTested > scores.snack && scores.timeTested > scores.meal) {
    return "TIME_TESTED";
  }
  if (scores.meal > scores.snack) {
    return "MEAL";
  }
  if (scores.snack > 0) {
    return "SNACK";
  }
  
  // Default to meal for unknown content
  return "MEAL";
}

export function inferMacroFromTitle(title: string): "SNACK" | "MEAL" | "TIME_TESTED" {
  const words = title.split(/\s+/).length;
  
  // Very short titles are likely snacks
  if (words <= 8) return "SNACK";
  
  // Very long titles suggest deep content
  if (words >= 20) return "TIME_TESTED";
  
  // Look for book indicators
  if (title.toLowerCase().includes("book") || 
      title.toLowerCase().includes("chapter") ||
      title.toLowerCase().includes("guide") ||
      title.toLowerCase().includes("manual") ||
      title.toLowerCase().includes("handbook")) {
    return "TIME_TESTED";
  }
  
  // Look for quick content indicators
  if (title.toLowerCase().includes("quick") || 
      title.toLowerCase().includes("brief") ||
      title.toLowerCase().includes("summary") ||
      title.toLowerCase().includes("news") ||
      title.toLowerCase().includes("update")) {
    return "SNACK";
  }
  
  // Look for thoughtful content indicators
  if (title.toLowerCase().includes("essay") || 
      title.toLowerCase().includes("analysis") ||
      title.toLowerCase().includes("deep dive") ||
      title.toLowerCase().includes("exploration") ||
      title.toLowerCase().includes("investigation")) {
    return "MEAL";
  }
  
  // Default based on word count
  if (words <= 12) return "SNACK";
  if (words >= 15) return "TIME_TESTED";
  return "MEAL";
}
