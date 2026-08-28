import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.thesportsdb.com/api/v1/json/123";

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Sports API request failed: ${res.status}`);
  return res.json();
}

function eventFromEspn(event: any) {
  const competition = event?.competitions?.[0];
  return {
    id: event?.id,
    name: event?.name || event?.shortName,
    date: event?.date ? String(event.date).slice(0, 10) : null,
    time: event?.date ? new Date(event.date).toISOString().slice(11, 16) : null,
    venue: competition?.venue?.fullName || competition?.venue?.address?.city || null,
    status: event?.status?.type?.shortDetail || event?.status?.type?.description || "NEXT",
  };
}

async function espnTeamSchedule(sport: string, league: string, teamId: string, teamName: string) {
  const data = await getJson(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule`);
  const now = Date.now() - 6 * 60 * 60 * 1000;
  const upcoming = (data?.events || [])
    .filter((e: any) => e?.date && new Date(e.date).getTime() >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  return {
    team: { id: teamId, name: teamName, badge: null },
    nextEvent: upcoming ? eventFromEspn(upcoming) : null,
    players: [],
    source: "ESPN",
  };
}

async function cardinalsSchedule() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 45);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const data = await getJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=138&startDate=${iso(start)}&endDate=${iso(end)}&hydrate=venue,team`);
  const game = (data?.dates || []).flatMap((d: any) => d.games || [])[0];
  return {
    team: { id: "138", name: "St. Louis Cardinals", badge: "https://www.mlbstatic.com/team-logos/138.svg" },
    nextEvent: game ? {
      id: String(game.gamePk),
      name: `${game.teams?.away?.team?.name || "Away"} at ${game.teams?.home?.team?.name || "Home"}`,
      date: String(game.gameDate).slice(0, 10),
      time: new Date(game.gameDate).toISOString().slice(11, 16),
      venue: game.venue?.name || null,
      status: game.status?.detailedState || "Scheduled",
    } : null,
    players: [],
    source: "MLB",
  };
}

async function bluesSchedule() {
  const data = await getJson("https://api-web.nhle.com/v1/club-schedule-season/STL/now");
  const now = Date.now() - 6 * 60 * 60 * 1000;
  const game = (data?.games || [])
    .filter((g: any) => g?.startTimeUTC && new Date(g.startTimeUTC).getTime() >= now)
    .sort((a: any, b: any) => new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime())[0];
  return {
    team: { id: "STL", name: "St. Louis Blues", badge: game?.homeTeam?.logo || game?.awayTeam?.logo || null },
    nextEvent: game ? {
      id: String(game.id),
      name: `${game.awayTeam?.placeName?.default || game.awayTeam?.abbrev || "Away"} at ${game.homeTeam?.placeName?.default || game.homeTeam?.abbrev || "Home"}`,
      date: String(game.startTimeUTC).slice(0, 10),
      time: new Date(game.startTimeUTC).toISOString().slice(11, 16),
      venue: game.venue?.default || null,
      status: game.gameState || "FUT",
    } : null,
    players: [],
    source: "NHL",
  };
}

async function exactTeam(key: string) {
  switch (key) {
    case "stl-cardinals": return cardinalsSchedule();
    case "stl-blues": return bluesSchedule();
    case "indiana-football": return espnTeamSchedule("football", "college-football", "84", "Indiana Hoosiers");
    case "indiana-basketball": return espnTeamSchedule("basketball", "mens-college-basketball", "84", "Indiana Hoosiers");
    case "slu-basketball": return espnTeamSchedule("basketball", "mens-college-basketball", "139", "Saint Louis Billikens");
    case "stl-city": return espnTeamSchedule("soccer", "usa.1", "21812", "St. Louis CITY SC");
    case "man-utd": return espnTeamSchedule("soccer", "eng.1", "360", "Manchester United");
    default: return null;
  }
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const key = request.nextUrl.searchParams.get("key")?.trim();

  try {
    if (key) {
      const exact = await exactTeam(key).catch(() => null);
      if (exact) return NextResponse.json(exact);
    }

    if (!name) return NextResponse.json({ error: "Missing team name" }, { status: 400 });

    const search = await getJson(`${BASE}/searchteams.php?t=${encodeURIComponent(name)}`);
    const team = search?.teams?.[0];
    if (!team) return NextResponse.json({ team: null, nextEvent: null, players: [] });

    const [next, players] = await Promise.all([
      getJson(`${BASE}/eventsnext.php?id=${encodeURIComponent(team.idTeam)}`).catch(() => ({ events: [] })),
      getJson(`${BASE}/lookup_all_players.php?id=${encodeURIComponent(team.idTeam)}`).catch(() => ({ player: [] })),
    ]);

    return NextResponse.json({
      team: {
        id: team.idTeam,
        name: team.strTeam,
        league: team.strLeague,
        sport: team.strSport,
        stadium: team.strStadium,
        location: team.strLocation,
        badge: team.strBadge,
        banner: team.strBanner,
        website: team.strWebsite,
      },
      nextEvent: next?.events?.[0]
        ? {
            id: next.events[0].idEvent,
            name: next.events[0].strEvent,
            date: next.events[0].dateEvent,
            time: next.events[0].strTime,
            venue: next.events[0].strVenue,
            status: next.events[0].strStatus,
          }
        : null,
      players: (players?.player || []).slice(0, 12).map((p: any) => ({
        id: p.idPlayer,
        name: p.strPlayer,
        position: p.strPosition,
        thumb: p.strThumb,
      })),
      source: "TheSportsDB",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sports API error" }, { status: 502 });
  }
}
