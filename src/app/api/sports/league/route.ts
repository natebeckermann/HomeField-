import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.thesportsdb.com/api/v1/json/123";

const leagueMap: Record<string, { id: string; name: string; standings: boolean }> = {
  mlb: { id: "4424", name: "MLB", standings: false },
  nhl: { id: "4380", name: "NHL", standings: false },
  nfl: { id: "4391", name: "NFL", standings: false },
  nba: { id: "4387", name: "NBA", standings: false },
  mls: { id: "4346", name: "MLS", standings: true },
  epl: { id: "4328", name: "Premier League", standings: true },
};

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Sports API request failed: ${res.status}`);
  return res.json();
}

function eventShape(event: any) {
  return {
    id: event.idEvent,
    name: event.strEvent,
    home: event.strHomeTeam,
    away: event.strAwayTeam,
    homeScore: event.intHomeScore,
    awayScore: event.intAwayScore,
    date: event.dateEvent,
    time: event.strTime,
    venue: event.strVenue,
    status: event.strStatus,
  };
}

export async function GET(request: NextRequest) {
  const leagueKey = request.nextUrl.searchParams.get("league")?.trim().toLowerCase();
  if (!leagueKey || !leagueMap[leagueKey]) {
    return NextResponse.json({ error: "Unsupported league" }, { status: 400 });
  }

  const league = leagueMap[leagueKey];
  const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  try {
    const [today, next, previous, table] = await Promise.all([
      getJson(`${BASE}/eventsday.php?d=${encodeURIComponent(date)}&l=${league.id}`).catch(() => ({ events: [] })),
      getJson(`${BASE}/eventsnextleague.php?id=${league.id}`).catch(() => ({ events: [] })),
      getJson(`${BASE}/eventspastleague.php?id=${league.id}`).catch(() => ({ events: [] })),
      league.standings
        ? getJson(`${BASE}/lookuptable.php?l=${league.id}`).catch(() => ({ table: [] }))
        : Promise.resolve({ table: [] }),
    ]);

    return NextResponse.json({
      league: { key: leagueKey, id: league.id, name: league.name },
      date,
      games: (today?.events || []).map(eventShape),
      next: (next?.events || []).map(eventShape),
      previous: (previous?.events || []).map(eventShape),
      standingsAvailable: league.standings,
      standings: (table?.table || []).slice(0, 20).map((row: any) => ({
        rank: row.intRank,
        team: row.strTeam,
        played: row.intPlayed,
        win: row.intWin,
        draw: row.intDraw,
        loss: row.intLoss,
        goalsFor: row.intGoalsFor,
        goalsAgainst: row.intGoalsAgainst,
        goalDifference: row.intGoalDifference,
        points: row.intPoints,
        badge: row.strBadge,
      })),
      source: "TheSportsDB",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sports API error" },
      { status: 502 },
    );
  }
}
