"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarDays, Flame, Newspaper, Radio } from "lucide-react";
import { defaultFavoriteTeamIds, defaultLeaguePrefs, demoStories, teamCatalog } from "@/data/demo";

const meta: Record<string, { name: string; sport: string; color: string; liveFeed: boolean }> = {
  mlb: { name: "MLB", sport: "Baseball", color: "#c41e3a", liveFeed: true },
  nhl: { name: "NHL", sport: "Hockey", color: "#2f5597", liveFeed: true },
  nfl: { name: "NFL", sport: "Football", color: "#1f6f43", liveFeed: true },
  nba: { name: "NBA", sport: "Basketball", color: "#c65d1e", liveFeed: true },
  cfb: { name: "College Football", sport: "Football", color: "#8f1d1d", liveFeed: false },
  cbb: { name: "College Basketball", sport: "Basketball", color: "#315caa", liveFeed: false },
  mls: { name: "MLS", sport: "Soccer", color: "#d73563", liveFeed: true },
  epl: { name: "Premier League", sport: "Soccer", color: "#6f2dbd", liveFeed: true },
  ucl: { name: "UEFA Champions League", sport: "Soccer", color: "#2448b8", liveFeed: false },
  pga: { name: "PGA Tour", sport: "Golf", color: "#2a7a4b", liveFeed: false },
};

type LiveGame = { id: string; name?: string; home?: string; away?: string; homeScore?: string | null; awayScore?: string | null; date?: string; time?: string; venue?: string; status?: string };
type Standing = { rank?: string; team?: string; played?: string; win?: string; draw?: string; loss?: string; goalDifference?: string; points?: string };
type LeagueData = { games: LiveGame[]; next: LiveGame[]; previous: LiveGame[]; standings: Standing[]; standingsAvailable: boolean; source?: string };

export default function LeaguePageClient({ leagueId }: { leagueId: string }) {
  const info = meta[leagueId] ?? { name: defaultLeaguePrefs.find((league) => league.id === leagueId)?.name ?? leagueId.toUpperCase(), sport: "Sports", color: "#5c6f82", liveFeed: false };
  const [tab, setTab] = useState("Overview");
  const [live, setLive] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(info.liveFeed);

  const teams = teamCatalog.filter((team) => team.league === info.name);
  const yourTeams = teams.filter((team) => defaultFavoriteTeamIds.includes(team.id));
  const stories = demoStories.filter((story) => teams.some((team) => team.id === story.teamId));

  useEffect(() => {
    if (!info.liveFeed) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/sports/league?league=${encodeURIComponent(leagueId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("feed unavailable"))))
      .then((data) => { if (!cancelled) setLive(data); })
      .catch(() => { if (!cancelled) setLive(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [leagueId, info.liveFeed]);

  const games = live?.games?.length ? live.games : live?.next?.length ? live.next : live?.previous || [];

  return <main className="pageShell">
    <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>{info.sport}</span></div>
    <section className="leagueHero" style={{background:`radial-gradient(circle at 85% 15%,${info.color}77,transparent 38%),linear-gradient(135deg,#171c23,#0c0f13)`}}><span className="eyebrow">LEAGUE HUB</span><h1>{info.name}</h1><p>Your teams first. Real schedules and tables where the free data feed supports them.</p></section>
    <nav className="tabs" aria-label={`${info.name} sections`}>{["Overview","Scores","Standings","News","Rumors","Leaders"].map(item=><button type="button" key={item} className={tab===item?"active":""} aria-pressed={tab===item} onClick={()=>setTab(item)}>{item}</button>)}</nav>

    {tab==="Overview"&&<>
      <Section label="YOUR TEAMS" title={`Priority in ${info.name}`}><div className="teamRail">{yourTeams.length?yourTeams.map(team=><Link href={`/team/${team.id}`} className="teamTile" key={team.id}><div className="teamLogo" style={{background:`linear-gradient(145deg,${team.primary},${team.secondary})`}}>{team.short}</div><strong>{team.name}</strong></Link>):<Empty text="No favorite team is set for this league."/>}</div></Section>
      <Section label="SCOREBOARD" title="Games & next up"><LiveGames games={games} loading={loading} supported={info.liveFeed}/></Section>
      <Section label="TOP STORIES" title={`${info.name} news`}><Stories stories={stories}/></Section>
      <Section label="RUMOR WIRE" title="What’s moving"><Rumors/></Section>
    </>}

    {tab==="Scores"&&<Section label="LIVE DATA" title={`${info.name} scoreboard`}><LiveGames games={games} loading={loading} supported={info.liveFeed}/></Section>}

    {tab==="Standings"&&<Section label="STANDINGS" title="League table">{loading?<Empty text="Loading standings…"/>:live?.standings?.length?<Standings rows={live.standings}/>:live?.standingsAvailable?<Empty text="The provider does not currently have a table for this competition."/>:<Empty text={info.liveFeed?"The free sports feed does not provide standings for this league yet.":"Live standings will be added with the next data-provider expansion."}/>}</Section>}

    {tab==="News"&&<Section label="NEWS" title={info.name}><Stories stories={stories}/></Section>}
    {tab==="Rumors"&&<Section label="RUMOR WIRE" title={`${info.name} movement`}><Rumors/></Section>}
    {tab==="Leaders"&&<Section label="LEAGUE LEADERS" title="Snapshot"><div className="statGrid">{[["Scoring","Leader"],["Efficiency","Top 5"],["Form","Trending"],["Rank","Live"]].map(([label,value])=><div className="statCard" key={label}><BarChart3/><span>{label}</span><strong>{value}</strong></div>)}</div></Section>}
  </main>;
}

function Section({label,title,children}:{label:string;title:string;children:React.ReactNode}){return <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">{label}</span><h2>{title}</h2></div></div>{children}</section>}

function LiveGames({games,loading,supported}:{games:LiveGame[];loading:boolean;supported:boolean}){
 if(loading)return <Empty text="Loading league games…"/>;
 if(!supported)return <Empty text="This competition is not mapped to the current free live-data provider yet."/>;
 if(!games.length)return <Empty text="No league games were returned for the current window."/>;
 return <div className="gameGrid">{games.map(game=><div className="gameCard" key={game.id}><Radio/><div><strong>{game.home&&game.away?`${game.away} at ${game.home}`:game.name||"League event"}</strong><small>{formatGame(game)}</small>{game.homeScore!=null&&game.awayScore!=null&&<small>{game.awayScore} - {game.homeScore}</small>}</div></div>)}</div>;
}

function formatGame(game:LiveGame){const date=game.date?new Date(`${game.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Date TBD";const time=game.time?game.time.slice(0,5):"Time TBD";return [date,time,game.venue,game.status].filter(Boolean).join(" · ")}

function Standings({rows}:{rows:Standing[]}){return <div className="table">{rows.map((row,index)=><div key={`${row.team}-${index}`}><b>{row.rank||index+1}</b><span>{row.team||"Team"}<small style={{display:"block",color:"#8f99a7"}}>{row.played?`${row.played} played · ${row.win||0}-${row.draw||0}-${row.loss||0}`:""}</small></span><strong>{row.points?`${row.points} pts`:row.goalDifference||"—"}</strong></div>)}</div>}

function Stories({stories}:{stories:typeof demoStories}){return <div className="storyList">{stories.length?stories.map(story=><article className="storyRow" key={story.id}><div className="storyThumb"><Newspaper/></div><div><small>{story.source} · {story.time}</small><h3>{story.headline}</h3><p>{story.summary}</p></div></article>):<Empty text="Free-to-read league coverage will populate here."/>}</div>}
function Rumors(){return <div className="rumorGrid">{["Heating Up","Worth Watching","Buzz"].map(status=><div className="rumorCard" key={status}><span><Flame size={14}/>{status}</span><h3>Trusted reporter activity</h3><p>Rumors will combine credible sources without overstating certainty.</p><small>Source count + latest update</small></div>)}</div>}
function Empty({text}:{text:string}){return <div className="empty">{text}</div>}
