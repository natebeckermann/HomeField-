import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.thesportsdb.com/api/v1/json/123";

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Sports API request failed: ${res.status}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "Missing team name" }, { status: 400 });
  }

  try {
    const search = await getJson(`${BASE}/searchteams.php?t=${encodeURIComponent(name)}`);
    const team = search?.teams?.[0];
    if (!team) {
      return NextResponse.json({ team: null, nextEvent: null, players: [] });
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sports API error" },
      { status: 502 },
    );
  }
}
