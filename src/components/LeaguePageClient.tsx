"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Flame,
  Newspaper,
  Trophy,
} from "lucide-react";
import {
  defaultFavoriteTeamIds,
  defaultLeaguePrefs,
  demoGames,
  demoStories,
  teamCatalog,
} from "@/data/demo";

const meta: Record<string, { name: string; sport: string; color: string }> = {
  mlb: { name: "MLB", sport: "Baseball", color: "#c41e3a" },
  nhl: { name: "NHL", sport: "Hockey", color: "#2f5597" },
  nfl: { name: "NFL", sport: "Football", color: "#1f6f43" },
  nba: { name: "NBA", sport: "Basketball", color: "#c65d1e" },
  cfb: { name: "College Football", sport: "Football", color: "#8f1d1d" },
  cbb: { name: "College Basketball", sport: "Basketball", color: "#315caa" },
  mls: { name: "MLS", sport: "Soccer", color: "#d73563" },
  epl: { name: "Premier League", sport: "Soccer", color: "#6f2dbd" },
  ucl: { name: "UEFA Champions League", sport: "Soccer", color: "#2448b8" },
  pga: { name: "PGA Tour", sport: "Golf", color: "#2a7a4b" },
};

export default function LeaguePageClient({ leagueId }: { leagueId: string }) {
  const info = meta[leagueId] ?? {
    name: defaultLeaguePrefs.find((league) => league.id === leagueId)?.name ?? leagueId.toUpperCase(),
    sport: "Sports",
    color: "#5c6f82",
  };

  const [tab, setTab] = useState("Overview");
  const teams = teamCatalog.filter((team) => team.league === info.name);
  const yourTeams = teams.filter((team) => defaultFavoriteTeamIds.includes(team.id));
  const games = demoGames.filter((game) => teams.some((team) => team.id === game.teamId));
  const stories = demoStories.filter((story) => teams.some((team) => team.id === story.teamId));

  return (
    <main className="pageShell">
      <div className="pageTop">
        <Link href="/" className="backLink">
          <ArrowLeft size={17} /> HomeField
        </Link>
        <span>{info.sport}</span>
      </div>

      <section
        className="leagueHero"
        style={{
          background: `radial-gradient(circle at 85% 15%,${info.color}77,transparent 38%),linear-gradient(135deg,#171c23,#0c0f13)`,
        }}
      >
        <span className="eyebrow">LEAGUE HUB</span>
        <h1>{info.name}</h1>
        <p>Your teams first. Scores, stories and movement ranked around what you follow.</p>
      </section>

      <nav className="tabs">
        {["Overview", "Scores", "Standings", "News", "Rumors", "Leaders"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === "Overview" && (
        <>
          <Section label="YOUR TEAMS" title={`Priority in ${info.name}`}>
            <div className="teamRail">
              {yourTeams.length > 0 ? (
                yourTeams.map((team) => (
                  <Link href={`/team/${team.id}`} className="teamTile" key={team.id}>
                    <div
                      className="teamLogo"
                      style={{ background: `linear-gradient(145deg,${team.primary},${team.secondary})` }}
                    >
                      {team.short}
                    </div>
                    <strong>{team.name}</strong>
                  </Link>
                ))
              ) : (
                <Empty />
              )}
            </div>
          </Section>

          <Section label="TODAY" title="Games & next up">
            <Games games={games} />
          </Section>
          <Section label="TOP STORIES" title={`${info.name} news`}>
            <Stories stories={stories} />
          </Section>
          <Section label="RUMOR WIRE" title="What’s moving">
            <Rumors />
          </Section>
        </>
      )}

      {tab === "Scores" && (
        <Section label="SCORES" title={`${info.name} games`}>
          <Games games={games} />
        </Section>
      )}

      {tab === "Standings" && (
        <Section label="STANDINGS" title="League table">
          <div className="table">
            {[1, 2, 3, 4, 5].map((rank, index) => (
              <div key={rank}>
                <b>{rank}</b>
                <span>{teams[index]?.name ?? `Team ${rank}`}</span>
                <strong>—</strong>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "News" && (
        <Section label="NEWS" title={info.name}>
          <Stories stories={stories} />
        </Section>
      )}

      {tab === "Rumors" && (
        <Section label="RUMOR WIRE" title={`${info.name} movement`}>
          <Rumors />
        </Section>
      )}

      {tab === "Leaders" && (
        <Section label="LEAGUE LEADERS" title="Snapshot">
          <div className="statGrid">
            {[
              ["Scoring", "Leader"],
              ["Efficiency", "Top 5"],
              ["Form", "Trending"],
              ["Rank", "Live"],
            ].map(([label, value]) => (
              <div className="statCard" key={label}>
                <BarChart3 />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="contentSection">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">{label}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Games({ games }: { games: typeof demoGames }) {
  return (
    <div className="gameGrid">
      {games.length > 0 ? (
        games.map((game) => (
          <Link href={`/game/${game.id}`} className="gameCard" key={game.id}>
            <CalendarDays />
            <div>
              <strong>{game.opponent}</strong>
              <small>{game.detail}</small>
            </div>
            <ChevronRight />
          </Link>
        ))
      ) : (
        <Empty />
      )}
    </div>
  );
}

function Stories({ stories }: { stories: typeof demoStories }) {
  return (
    <div className="storyList">
      {stories.length > 0 ? (
        stories.map((story) => (
          <article className="storyRow" key={story.id}>
            <div className="storyThumb">
              <Newspaper />
            </div>
            <div>
              <small>
                {story.source} · {story.time}
              </small>
              <h3>{story.headline}</h3>
              <p>{story.summary}</p>
            </div>
          </article>
        ))
      ) : (
        <Empty />
      )}
    </div>
  );
}

function Rumors() {
  return (
    <div className="rumorGrid">
      {["Heating Up", "Worth Watching", "Buzz"].map((status) => (
        <div className="rumorCard" key={status}>
          <span>
            <Flame size={14} /> {status}
          </span>
          <h3>Trusted reporter activity</h3>
          <p>Rumors will combine credible sources without overstating certainty.</p>
          <small>Source count + latest update</small>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <div className="empty">Live data will populate here.</div>;
}
