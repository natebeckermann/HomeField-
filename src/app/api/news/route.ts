import { NextRequest, NextResponse } from "next/server";

const ESPN_FEEDS = [
  ["MLB", "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=20"],
  ["NHL", "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news?limit=20"],
  ["College Football", "https://site.api.espn.com/apis/site/v2/sports/football/college-football/news?limit=20"],
  ["College Basketball", "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news?limit=20"],
  ["MLS", "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news?limit=20"],
  ["Premier League", "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=20"],
  ["NFL", "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=20"],
  ["NBA", "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=12"],
] as const;

const BR_FEEDS = [
  ["MLB", "https://bleacherreport.com/mlb"],
  ["NHL", "https://bleacherreport.com/nhl"],
  ["College Football", "https://bleacherreport.com/college-football"],
  ["College Basketball", "https://bleacherreport.com/college-basketball"],
  ["Soccer", "https://bleacherreport.com/world-football"],
  ["NFL", "https://bleacherreport.com/nfl"],
  ["NBA", "https://bleacherreport.com/nba"],
] as const;

const TEAM_TERMS: Record<string, string[]> = {
  "stl-cardinals": ["st. louis cardinals", "st louis cardinals", "cardinals"],
  "stl-blues": ["st. louis blues", "st louis blues", "blues"],
  "indiana-football": ["indiana hoosiers", "indiana football", "hoosiers"],
  "indiana-basketball": ["indiana hoosiers", "indiana basketball", "hoosiers"],
  "slu-basketball": ["saint louis billikens", "st. louis billikens", "slu", "billikens"],
  "stl-city": ["st. louis city sc", "st louis city sc", "st. louis city", "st louis city", "city sc"],
  "man-utd": ["manchester united", "man united", "man utd"],
};

type Story = {
  id: string;
  headline: string;
  summary: string;
  source: "ESPN" | "Bleacher Report";
  league: string;
  url: string;
  image: string | null;
  published: string | null;
  favoriteTeamIds: string[];
  personalized: boolean;
  sourceRank: number;
  feedRank: number;
};

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`News feed failed: ${res.status}`);
  return res.json();
}

async function getText(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { "user-agent": "HomeField/1.0" },
  });
  if (!res.ok) throw new Error(`News page failed: ${res.status}`);
  return res.text();
}

function normalizeText(value: unknown) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return normalizeText(value.replace(/<[^>]+>/g, " "));
}

function isPaid(article: any) {
  const text = `${article?.headline || ""} ${article?.description || ""} ${article?.type || ""}`.toLowerCase();
  const href = String(article?.links?.web?.href || "").toLowerCase();
  return Boolean(
    article?.premium === true ||
      article?.paywall === true ||
      article?.type === "Premium" ||
      text.includes("espn+") ||
      text.includes("subscriber only") ||
      text.includes("insider") ||
      href.includes("espnplus") ||
      href.includes("/insider/")
  );
}

function slugHeadline(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function headlineWords(value: string) {
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "at", "with", "from", "after", "before", "is", "are", "as", "vs"]);
  return new Set(slugHeadline(value).split(" ").filter((w) => w.length > 2 && !stop.has(w)));
}

function similarHeadline(a: string, b: string) {
  const aw = headlineWords(a);
  const bw = headlineWords(b);
  if (!aw.size || !bw.size) return false;
  let intersection = 0;
  aw.forEach((word) => { if (bw.has(word)) intersection += 1; });
  const union = new Set([...aw, ...bw]).size;
  const jaccard = union ? intersection / union : 0;
  const containment = intersection / Math.min(aw.size, bw.size);
  return jaccard >= 0.56 || containment >= 0.72;
}

function articleImage(article: any) {
  const images = article?.images || [];
  return images.find((img: any) => img?.url)?.url || null;
}

function matchingTeamsText(text: string, favoriteIds: string[]) {
  const haystack = text.toLowerCase();
  return favoriteIds.filter((id) => (TEAM_TERMS[id] || []).some((term) => haystack.includes(term)));
}

function matchingTeams(article: any, favoriteIds: string[]) {
  const text = `${article?.headline || ""} ${article?.description || ""} ${(article?.categories || []).map((c: any) => c?.description || c?.name || "").join(" ")}`;
  return matchingTeamsText(text, favoriteIds);
}

function extractBleacherStories(html: string, league: string, favoriteIds: string[]): Story[] {
  const stories: Story[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b[^>]*href=["']([^"']*\/articles\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  let rank = 0;

  while ((match = anchorRegex.exec(html)) && stories.length < 18) {
    const rawHref = match[1];
    const headline = stripTags(match[2]);
    if (!headline || headline.length < 18 || headline.length > 180) continue;
    if (/subscribe|newsletter|sign up/i.test(headline)) continue;
    const key = slugHeadline(headline);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const url = rawHref.startsWith("http") ? rawHref : `https://bleacherreport.com${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;
    const teams = matchingTeamsText(headline, favoriteIds);
    stories.push({
      id: `br-${league}-${key.slice(0, 70)}`,
      headline,
      summary: "",
      source: "Bleacher Report",
      league,
      url,
      image: null,
      published: null,
      favoriteTeamIds: teams,
      personalized: teams.length > 0,
      sourceRank: 2,
      feedRank: rank++,
    });
  }
  return stories;
}

async function espnStories(favoriteIds: string[]) {
  const results = await Promise.all(
    ESPN_FEEDS.map(async ([league, url]) => {
      try {
        const data = await getJson(url);
        return (data?.articles || []).map((article: any, feedRank: number) => ({ article, league, feedRank }));
      } catch {
        return [];
      }
    }),
  );

  return results.flat()
    .filter(({ article }) => article?.headline && article?.links?.web?.href && !isPaid(article))
    .map(({ article, league, feedRank }): Story => {
      const teams = matchingTeams(article, favoriteIds);
      return {
        id: String(article?.id || article?.dataSourceIdentifier || `${league}-${slugHeadline(article.headline)}`),
        headline: normalizeText(article.headline),
        summary: normalizeText(article.description || article.story || ""),
        source: "ESPN",
        league,
        url: article.links.web.href,
        image: articleImage(article),
        published: article?.published || article?.lastModified || null,
        favoriteTeamIds: teams,
        personalized: teams.length > 0,
        sourceRank: 1,
        feedRank,
      };
    });
}

async function bleacherStories(favoriteIds: string[]) {
  const results = await Promise.all(
    BR_FEEDS.map(async ([league, url]) => {
      try {
        const html = await getText(url);
        return extractBleacherStories(html, league, favoriteIds);
      } catch {
        return [];
      }
    }),
  );
  return results.flat();
}

function dedupeStories(input: Story[]) {
  const selected: Story[] = [];
  const ordered = [...input].sort((a, b) => {
    if (a.personalized !== b.personalized) return a.personalized ? -1 : 1;
    const aTime = a.published ? new Date(a.published).getTime() : 0;
    const bTime = b.published ? new Date(b.published).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
    return a.feedRank - b.feedRank;
  });

  for (const story of ordered) {
    const duplicateIndex = selected.findIndex((existing) => similarHeadline(existing.headline, story.headline));
    if (duplicateIndex === -1) {
      selected.push(story);
      continue;
    }
    const existing = selected[duplicateIndex];
    if (story.sourceRank < existing.sourceRank) selected[duplicateIndex] = story;
  }
  return selected;
}

export async function GET(request: NextRequest) {
  const favoriteIds = (request.nextUrl.searchParams.get("teams") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const [espn, bleacher] = await Promise.all([
    espnStories(favoriteIds),
    bleacherStories(favoriteIds),
  ]);

  const stories = dedupeStories([...espn, ...bleacher])
    .sort((a, b) => {
      if (a.personalized !== b.personalized) return a.personalized ? -1 : 1;
      const aTime = a.published ? new Date(a.published).getTime() : 0;
      const bTime = b.published ? new Date(b.published).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
      return a.feedRank - b.feedRank;
    })
    .slice(0, 40)
    .map(({ sourceRank, feedRank, ...story }) => story);

  return NextResponse.json({
    stories,
    source: "ESPN + Bleacher Report",
    sources: [
      { name: "ESPN", count: espn.length, priority: 1 },
      { name: "Bleacher Report", count: bleacher.length, priority: 2 },
    ],
    generatedAt: new Date().toISOString(),
  });
}
