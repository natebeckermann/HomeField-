import { NextRequest, NextResponse } from "next/server";

const SPORTSDB = "https://www.thesportsdb.com/api/v1/json/123";

const leagueMap: Record<string, { id: string; name: string; standings: boolean }> = {
  mlb: { id: "4424", name: "MLB", standings: true },
  nhl: { id: "4380", name: "NHL", standings: true },
  nfl: { id: "4391", name: "NFL", standings: true },
  nba: { id: "4387", name: "NBA", standings: true },
  mls: { id: "4346", name: "MLS", standings: true },
  epl: { id: "4328", name: "Premier League", standings: true },
};

async function getJson(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 600 },
    headers: { "User-Agent": "HomeField/1.0" },
  });
  if (!res.ok) throw new Error(`Sports API request failed: ${res.status}`);
  return res.json();
}

function sportsDbEvent(event: any) {
  return {
    id: String(event.idEvent || ""), name: event.strEvent,
    home: event.strHomeTeam, away: event.strAwayTeam,
    homeLogo: event.strHomeTeamBadge || undefined, awayLogo: event.strAwayTeamBadge || undefined,
    homeScore: event.intHomeScore, awayScore: event.intAwayScore,
    date: event.dateEvent, time: event.strTime, venue: event.strVenue, status: event.strStatus,
  };
}

function espnEvent(event: any) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((c: any) => c.homeAway === "home");
  const away = competitors.find((c: any) => c.homeAway === "away");
  const date = event?.date ? new Date(event.date) : null;
  return {
    id: String(event?.id || ""), name: event?.name,
    home: home?.team?.displayName, away: away?.team?.displayName,
    homeLogo: home?.team?.logo, awayLogo: away?.team?.logo,
    homeScore: home?.score ?? null, awayScore: away?.score ?? null,
    date: date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : undefined,
    time: date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(11, 19) : undefined,
    venue: competition?.venue?.fullName,
    status: event?.status?.type?.shortDetail || event?.status?.type?.description,
  };
}

function statValue(stats: any[], names: string[]) {
  for (const name of names) {
    const found = stats?.find((s: any) => s.name === name || s.abbreviation === name);
    if (found?.displayValue != null) return String(found.displayValue);
    if (found?.value != null) return String(found.value);
  }
  return undefined;
}

function parseEspnStandings(data: any) {
  const groups = data?.children || [];
  const entries = groups.flatMap((group: any) => group?.standings?.entries || []);
  return entries.map((entry: any, index: number) => {
    const stats = entry?.stats || [];
    return {
      rank: statValue(stats, ["playoffSeed", "rank"]) || String(index + 1),
      team: entry?.team?.displayName || entry?.team?.name,
      badge: entry?.team?.logos?.[0]?.href || entry?.team?.logo,
      played: statValue(stats, ["gamesPlayed"]), win: statValue(stats, ["wins", "W"]),
      draw: statValue(stats, ["ties", "T"]), loss: statValue(stats, ["losses", "L"]),
      points: statValue(stats, ["points", "PTS"]), goalDifference: statValue(stats, ["pointDifferential", "differential"]),
      pct: statValue(stats, ["winPercent", "PCT"]),
    };
  }).filter((row: any) => row.team);
}

async function sportsDbLeague(leagueKey: string, league: { id: string; name: string }, date: string) {
  const [today, next, previous, table] = await Promise.all([
    getJson(`${SPORTSDB}/eventsday.php?d=${encodeURIComponent(date)}&l=${league.id}`).catch(() => ({ events: [] })),
    getJson(`${SPORTSDB}/eventsnextleague.php?id=${league.id}`).catch(() => ({ events: [] })),
    getJson(`${SPORTSDB}/eventspastleague.php?id=${league.id}`).catch(() => ({ events: [] })),
    getJson(`${SPORTSDB}/lookuptable.php?l=${league.id}`).catch(() => ({ table: [] })),
  ]);
  return {
    league: { key: leagueKey, id: league.id, name: league.name }, date,
    games: (today?.events || []).map(sportsDbEvent), next: (next?.events || []).map(sportsDbEvent), previous: (previous?.events || []).map(sportsDbEvent),
    standings: (table?.table || []).slice(0, 40).map((row: any) => ({
      rank: row.intRank, team: row.strTeam, badge: row.strBadge,
      played: row.intPlayed, win: row.intWin, draw: row.intDraw, loss: row.intLoss,
      goalDifference: row.intGoalDifference, points: row.intPoints,
    })), source: "TheSportsDB",
  };
}

async function mlbData(date: string) {
  const season = Number(date.slice(0, 4));
  const [standings, schedule] = await Promise.all([
    getJson(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`),
    getJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team,linescore`),
  ]);
  const rows = (standings?.records || []).flatMap((record: any) => (record?.teamRecords || []).map((row: any) => ({
    rank: row.divisionRank || row.leagueRank, team: row.team?.name,
    badge: row.team?.id ? `https://www.mlbstatic.com/team-logos/${row.team.id}.svg` : undefined,
    played: String((row.wins || 0) + (row.losses || 0)), win: String(row.wins ?? ""), draw: "0", loss: String(row.losses ?? ""),
    points: undefined, goalDifference: row.gamesBack, pct: row.winningPercentage,
  })));
  const games = (schedule?.dates || []).flatMap((d: any) => d?.games || []).map((game: any) => ({
    id: String(game.gamePk), name: `${game.teams?.away?.team?.name} at ${game.teams?.home?.team?.name}`,
    home: game.teams?.home?.team?.name, away: game.teams?.away?.team?.name,
    homeLogo: game.teams?.home?.team?.id ? `https://www.mlbstatic.com/team-logos/${game.teams.home.team.id}.svg` : undefined,
    awayLogo: game.teams?.away?.team?.id ? `https://www.mlbstatic.com/team-logos/${game.teams.away.team.id}.svg` : undefined,
    homeScore: game.teams?.home?.score ?? null, awayScore: game.teams?.away?.score ?? null,
    date: game.officialDate, time: game.gameDate ? String(game.gameDate).slice(11, 19) : undefined,
    venue: game.venue?.name, status: game.status?.abstractGameState || game.status?.detailedState,
  }));
  return { games, standings: rows, source: "MLB Stats API" };
}

async function nhlData(date: string) {
  const [standings, schedule] = await Promise.all([
    getJson("https://api-web.nhle.com/v1/standings/now"),
    getJson(`https://api-web.nhle.com/v1/schedule/${encodeURIComponent(date)}`),
  ]);
  const rows = (standings?.standings || []).map((row: any) => ({
    rank: String(row.leagueSequence || ""), team: row.teamName?.default || row.teamCommonName?.default,
    badge: row.teamLogo,
    played: String(row.gamesPlayed ?? ""), win: String(row.wins ?? ""), draw: String(row.otLosses ?? ""), loss: String(row.losses ?? ""),
    points: String(row.points ?? ""), goalDifference: String(row.goalDifferential ?? ""), pct: row.pointPctg != null ? String(row.pointPctg) : undefined,
  }));
  const games = (schedule?.gameWeek || []).flatMap((day: any) => day?.games || []).map((game: any) => ({
    id: String(game.id), name: `${game.awayTeam?.placeName?.default || game.awayTeam?.abbrev} at ${game.homeTeam?.placeName?.default || game.homeTeam?.abbrev}`,
    home: game.homeTeam?.placeName?.default || game.homeTeam?.abbrev, away: game.awayTeam?.placeName?.default || game.awayTeam?.abbrev,
    homeLogo: game.homeTeam?.logo, awayLogo: game.awayTeam?.logo,
    homeScore: game.homeTeam?.score ?? null, awayScore: game.awayTeam?.score ?? null,
    date: game.gameDate, time: game.startTimeUTC ? String(game.startTimeUTC).slice(11, 19) : undefined,
    venue: game.venue?.default, status: game.gameState,
  }));
  return { games, standings: rows, source: "NHL Web API" };
}

async function espnData(leagueKey: "nfl" | "nba") {
  const sport = leagueKey === "nfl" ? "football" : "basketball";
  const [scoreboard, standings] = await Promise.all([
    getJson(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${leagueKey}/scoreboard`),
    getJson(`https://site.api.espn.com/apis/v2/sports/${sport}/${leagueKey}/standings`),
  ]);
  return { games: (scoreboard?.events || []).map(espnEvent), standings: parseEspnStandings(standings), source: "ESPN site feed" };
}

export async function GET(request: NextRequest) {
  const leagueKey = request.nextUrl.searchParams.get("league")?.trim().toLowerCase();
  if (!leagueKey || !leagueMap[leagueKey]) return NextResponse.json({ error: "Unsupported league" }, { status: 400 });
  const league = leagueMap[leagueKey];
  const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  try {
    const fallback = await sportsDbLeague(leagueKey, league, date);
    let primary: { games?: any[]; standings?: any[]; source?: string } | null = null;
    if (leagueKey === "mlb") primary = await mlbData(date).catch(() => null);
    if (leagueKey === "nhl") primary = await nhlData(date).catch(() => null);
    if (leagueKey === "nfl" || leagueKey === "nba") primary = await espnData(leagueKey).catch(() => null);
    const standings = primary?.standings?.length ? primary.standings : fallback.standings;
    const games = primary?.games?.length ? primary.games : fallback.games;
    return NextResponse.json({ ...fallback, games, standings, standingsAvailable: standings.length > 0,
      source: primary?.source || fallback.source, providers: primary?.source ? [primary.source, fallback.source] : [fallback.source] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sports API error" }, { status: 502 });
  }
}
