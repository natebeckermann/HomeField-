import { NextRequest, NextResponse } from "next/server";

const FEEDS = [
  ["MLB", "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=20"],
  ["NHL", "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news?limit=20"],
  ["College Football", "https://site.api.espn.com/apis/site/v2/sports/football/college-football/news?limit=20"],
  ["College Basketball", "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news?limit=20"],
  ["MLS", "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news?limit=20"],
  ["Premier League", "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=20"],
  ["NFL", "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=20"],
  ["NBA", "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=12"],
];

const TEAM_TERMS: Record<string, string[]> = {
  "stl-cardinals": ["st. louis cardinals", "st louis cardinals", "cardinals"],
  "stl-blues": ["st. louis blues", "st louis blues", "blues"],
  "indiana-football": ["indiana hoosiers", "indiana football", "hoosiers"],
  "indiana-basketball": ["indiana hoosiers", "indiana basketball", "hoosiers"],
  "slu-basketball": ["saint louis billikens", "st. louis billikens", "slu", "billikens"],
  "stl-city": ["st. louis city sc", "st louis city sc", "st. louis city", "st louis city", "city sc"],
  "man-utd": ["manchester united", "man united", "man utd"],
};

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`News feed failed: ${res.status}`);
  return res.json();
}

function normalizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function articleImage(article: any) {
  const images = article?.images || [];
  return images.find((img: any) => img?.url)?.url || null;
}

function matchingTeams(article: any, favoriteIds: string[]) {
  const haystack = `${article?.headline || ""} ${article?.description || ""} ${(article?.categories || []).map((c: any) => c?.description || c?.name || "").join(" ")}`.toLowerCase();
  return favoriteIds.filter((id) => (TEAM_TERMS[id] || []).some((term) => haystack.includes(term)));
}

export async function GET(request: NextRequest) {
  const favoriteIds = (request.nextUrl.searchParams.get("teams") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const results = await Promise.all(
    FEEDS.map(async ([league, url]) => {
      try {
        const data = await getJson(url);
        return (data?.articles || []).map((article: any) => ({ article, league }));
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<string>();
  const stories = results
    .flat()
    .filter(({ article }) => article?.headline && article?.links?.web?.href && !isPaid(article))
    .map(({ article, league }) => {
      const teams = matchingTeams(article, favoriteIds);
      const published = article?.published || article?.lastModified || null;
      return {
        id: String(article?.id || article?.dataSourceIdentifier || `${league}-${slugHeadline(article.headline)}`),
        headline: normalizeText(article.headline),
        summary: normalizeText(article.description || article.story || ""),
        source: "ESPN",
        league,
        url: article.links.web.href,
        image: articleImage(article),
        published,
        favoriteTeamIds: teams,
        personalized: teams.length > 0,
      };
    })
    .filter((story) => {
      const key = slugHeadline(story.headline);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (a.personalized !== b.personalized) return a.personalized ? -1 : 1;
      const aTime = a.published ? new Date(a.published).getTime() : 0;
      const bTime = b.published ? new Date(b.published).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 30);

  return NextResponse.json({ stories, source: "ESPN", generatedAt: new Date().toISOString() });
}
