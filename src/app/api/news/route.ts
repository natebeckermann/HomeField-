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

const BR_RSS = "https://feeds.bleacherreport.com/articles";

const TEAM_TERMS: Record<string, string[]> = {
  "stl-cardinals": ["st. louis cardinals", "st louis cardinals", "cardinals"],
  "stl-blues": ["st. louis blues", "st louis blues", "blues"],
  "indiana-football": ["indiana hoosiers", "indiana football", "hoosiers"],
  "indiana-basketball": ["indiana hoosiers", "indiana basketball", "hoosiers"],
  "slu-basketball": ["saint louis billikens", "st. louis billikens", "slu", "billikens"],
  "stl-city": ["st. louis city sc", "st louis city sc", "st. louis city", "st louis city", "city sc"],
  "man-utd": ["manchester united", "man united", "man utd"],
};

const TEAM_LEAGUES: Record<string, string[]> = {
  "stl-cardinals": ["MLB"],
  "stl-blues": ["NHL"],
  "indiana-football": ["College Football"],
  "indiana-basketball": ["College Basketball"],
  "slu-basketball": ["College Basketball"],
  "stl-city": ["MLS"],
  "man-utd": ["Premier League", "Soccer"],
};

type Story = {
  id: string; headline: string; summary: string; source: "ESPN" | "Bleacher Report"; league: string;
  url: string; image: string | null; published: string | null; favoriteTeamIds: string[]; personalized: boolean;
  sourceRank: number; feedRank: number;
};

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`News feed failed: ${res.status}`);
  return res.json();
}

async function getText(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { "user-agent": "Mozilla/5.0 HomeField/1.0", accept: "application/rss+xml, application/xml, text/xml, text/plain, */*" },
  });
  if (!res.ok) throw new Error(`News feed failed: ${res.status}`);
  return res.text();
}

function normalizeText(value: unknown) {
  return String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function stripTags(value: string) { return normalizeText(value.replace(/<[^>]+>/g, " ")); }
function xmlValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? normalizeText(match[1]) : "";
}
function isPaid(article: any) {
  const text = `${article?.headline || ""} ${article?.description || ""} ${article?.type || ""}`.toLowerCase();
  const href = String(article?.links?.web?.href || "").toLowerCase();
  return Boolean(article?.premium === true || article?.paywall === true || article?.type === "Premium" || text.includes("espn+") ||
    text.includes("subscriber only") || text.includes("insider") || href.includes("espnplus") || href.includes("/insider/"));
}
function slugHeadline(value: string) { return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function headlineWords(value: string) {
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "at", "with", "from", "after", "before", "is", "are", "as", "vs"]);
  return new Set(slugHeadline(value).split(" ").filter((w) => w.length > 2 && !stop.has(w)));
}
function similarHeadline(a: string, b: string) {
  const aw = headlineWords(a), bw = headlineWords(b); if (!aw.size || !bw.size) return false;
  let intersection = 0; aw.forEach((word) => { if (bw.has(word)) intersection += 1; });
  const union = new Set([...aw, ...bw]).size; const jaccard = union ? intersection / union : 0; const containment = intersection / Math.min(aw.size, bw.size);
  return jaccard >= 0.56 || containment >= 0.72;
}
function articleImage(article: any) { return (article?.images || []).find((img: any) => img?.url)?.url || null; }
function matchingTeamsText(text: string, favoriteIds: string[], league?: string) {
  const haystack = text.toLowerCase();
  return favoriteIds.filter((id) => {
    if (league && TEAM_LEAGUES[id]?.length && !TEAM_LEAGUES[id].includes(league)) return false;
    return (TEAM_TERMS[id] || []).some((term) => haystack.includes(term));
  });
}
function matchingTeams(article: any, favoriteIds: string[], league: string) {
  return matchingTeamsText(`${article?.headline || ""} ${article?.description || ""} ${(article?.categories || []).map((c: any) => c?.description || c?.name || "").join(" ")}`, favoriteIds, league);
}
function inferLeague(text: string) {
  const t = text.toLowerCase();
  if (/mlb|baseball|st\. louis cardinals|st louis cardinals|yankees|dodgers|cubs|mets|phillies|braves|astros/.test(t)) return "MLB";
  if (/nhl|hockey|st\. louis blues|st louis blues|oilers|maple leafs|rangers|bruins|avalanche/.test(t)) return "NHL";
  if (/college football|cfb|ncaa football|indiana football|big ten football/.test(t)) return "College Football";
  if (/college basketball|ncaa basketball|march madness|billikens|indiana basketball/.test(t)) return "College Basketball";
  if (/mls|st\. louis city|st louis city|inter miami|lafc|fc dallas/.test(t)) return "MLS";
  if (/premier league|manchester united|man united|arsenal|liverpool|chelsea|man city|tottenham/.test(t)) return "Premier League";
  if (/nfl|chiefs|cowboys|eagles|bills|ravens|browns|packers|steelers|arizona cardinals/.test(t)) return "NFL";
  if (/nba|lakers|celtics|knicks|warriors|bucks|nuggets|thunder/.test(t)) return "NBA";
  return "Sports";
}
function extractRssImage(block: string) {
  const media = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] || block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] || block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i)?.[1];
  if (media) return normalizeText(media); const desc = xmlValue(block, "description"); return desc.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
}
function extractBleacherRss(xml: string, favoriteIds: string[]): Story[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || []; const stories: Story[] = []; const seen = new Set<string>();
  items.forEach((item, feedRank) => {
    const headline = stripTags(xmlValue(item, "title")); const url = normalizeText(xmlValue(item, "link"));
    if (!headline || !url || !url.includes("bleacherreport.com") || /subscribe|newsletter|sign up/i.test(headline)) return;
    const key = slugHeadline(headline); if (!key || seen.has(key)) return; seen.add(key);
    const description = stripTags(xmlValue(item, "description"));
    const categories = Array.from(item.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)).map((m) => stripTags(m[1])).join(" ");
    const text = `${headline} ${description} ${categories} ${url}`; const league = inferLeague(text); const teams = matchingTeamsText(text, favoriteIds, league);
    stories.push({ id: `br-${key.slice(0, 80)}`, headline, summary: description, source: "Bleacher Report", league, url,
      image: extractRssImage(item), published: xmlValue(item, "pubDate") || xmlValue(item, "dc:date") || null, favoriteTeamIds: teams,
      personalized: teams.length > 0, sourceRank: 2, feedRank });
  });
  return stories.slice(0, 40);
}
async function espnStories(favoriteIds: string[]) {
  const results = await Promise.all(ESPN_FEEDS.map(async ([league, url]) => {
    try { const data = await getJson(url); return (data?.articles || []).map((article: any, feedRank: number) => ({ article, league, feedRank })); }
    catch { return []; }
  }));
  return results.flat().filter(({ article }) => article?.headline && article?.links?.web?.href && !isPaid(article)).map(({ article, league, feedRank }): Story => {
    const teams = matchingTeams(article, favoriteIds, league); return { id: String(article?.id || article?.dataSourceIdentifier || `${league}-${slugHeadline(article.headline)}`),
      headline: normalizeText(article.headline), summary: normalizeText(article.description || article.story || ""), source: "ESPN", league,
      url: article.links.web.href, image: articleImage(article), published: article?.published || article?.lastModified || null,
      favoriteTeamIds: teams, personalized: teams.length > 0, sourceRank: 1, feedRank };
  });
}
async function bleacherStories(favoriteIds: string[]) { try { return extractBleacherRss(await getText(BR_RSS), favoriteIds); } catch { return []; } }
function dedupeStories(input: Story[]) {
  const selected: Story[] = []; const ordered = rankStories(input);
  for (const story of ordered) {
    const duplicateIndex = selected.findIndex((existing) => similarHeadline(existing.headline, story.headline));
    if (duplicateIndex === -1) selected.push(story); else if (story.sourceRank < selected[duplicateIndex].sourceRank) selected[duplicateIndex] = story;
  }
  return selected;
}
function rankStories(input: Story[]) {
  return [...input].sort((a, b) => {
    if (a.personalized !== b.personalized) return a.personalized ? -1 : 1;
    const aTime = a.published ? new Date(a.published).getTime() : 0, bTime = b.published ? new Date(b.published).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime; if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank; return a.feedRank - b.feedRank;
  });
}
function diversifyFavoriteTeams(ranked: Story[], favoriteIds: string[]) {
  const selected: Story[] = []; const used = new Set<string>();
  const candidates = favoriteIds
    .map((teamId) => ranked.find((story) => story.favoriteTeamIds.includes(teamId) && !used.has(story.id)))
    .filter((story): story is Story => Boolean(story));
  const uniqueCandidates = rankStories(candidates.filter((story) => {
    if (used.has(story.id)) return false; used.add(story.id); return true;
  }));
  selected.push(...uniqueCandidates);
  for (const story of ranked) if (!selected.some((s) => s.id === story.id)) selected.push(story);
  return selected;
}
function ensureSourceDiversity(ranked: Story[]) {
  const firstSix = ranked.slice(0, 6); if (firstSix.some((s) => s.source === "Bleacher Report")) return ranked;
  const brIndex = ranked.findIndex((s, i) => i >= 6 && s.source === "Bleacher Report"); if (brIndex === -1) return ranked;
  const br = ranked[brIndex]; return [...ranked.slice(0, 5), br, ...ranked.slice(5, brIndex), ...ranked.slice(brIndex + 1)];
}

export async function GET(request: NextRequest) {
  const favoriteIds = (request.nextUrl.searchParams.get("teams") || "").split(",").map((x) => x.trim()).filter(Boolean);
  const [espn, bleacher] = await Promise.all([espnStories(favoriteIds), bleacherStories(favoriteIds)]);
  const deduped = dedupeStories([...espn, ...bleacher]);
  const ranked = ensureSourceDiversity(diversifyFavoriteTeams(rankStories(deduped), favoriteIds));
  const stories = ranked.slice(0, 40).map(({ sourceRank, feedRank, ...story }) => story);
  return NextResponse.json({ stories, source: "ESPN + Bleacher Report", personalization: {
    favoriteTeamsRequested: favoriteIds.length,
    favoriteTeamsRepresented: new Set(stories.flatMap((story) => story.favoriteTeamIds)).size,
  }, sources: [
    { name: "ESPN", count: espn.length, priority: 1 }, { name: "Bleacher Report", count: bleacher.length, priority: 2 }
  ], generatedAt: new Date().toISOString() });
}
