"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,CalendarDays,ChevronRight,Trophy} from "lucide-react";
import {defaultFavoriteTeamIds,events,teamCatalog} from "@/data/demo";

const KEY="homefield-preferences-v1";
const SUPPORTED=[{id:"mlb",name:"MLB"},{id:"nhl",name:"NHL"},{id:"nfl",name:"NFL"},{id:"nba",name:"NBA"},{id:"mls",name:"MLS"},{id:"epl",name:"Premier League"}];

type LiveGame={id:string;name?:string;home?:string;away?:string;homeLogo?:string;awayLogo?:string;homeScore?:string|null;awayScore?:string|null;date?:string;time?:string;venue?:string;status?:string};
type Standing={rank?:string;team?:string;badge?:string;played?:string;win?:string;draw?:string;loss?:string;points?:string;pct?:string};
type LeagueFeed={league:{key:string;name:string};games:LiveGame[];next:LiveGame[];previous:LiveGame[];standingsAvailable:boolean;standings:Standing[];source?:string};

function formatGame(game:LiveGame){const date=game.date?new Date(`${game.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Date TBD";const time=game.time?game.time.slice(0,5):"Time TBD";return [date,time,game.venue].filter(Boolean).join(" · ")}
function isScored(g:LiveGame){return g.homeScore!=null&&g.awayScore!=null}

export default function ScoresPage(){
 const [favoriteIds,setFavoriteIds]=useState(defaultFavoriteTeamIds);const [feeds,setFeeds]=useState<LeagueFeed[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setFavoriteIds(JSON.parse(raw).favoriteTeamIds||defaultFavoriteTeamIds)}catch{}},[]);
 const favorites=useMemo(()=>favoriteIds.map(id=>teamCatalog.find(t=>t.id===id)).filter(Boolean) as typeof teamCatalog,[favoriteIds]);
 useEffect(()=>{let cancelled=false;async function load(){setLoading(true);const rows=await Promise.all(SUPPORTED.map(async league=>{try{const res=await fetch(`/api/sports/league?league=${league.id}`);if(!res.ok)return null;return await res.json() as LeagueFeed}catch{return null}}));if(!cancelled){setFeeds(rows.filter(Boolean) as LeagueFeed[]);setLoading(false)}}load();return()=>{cancelled=true}},[]);
 const favoriteGames=useMemo(()=>{const names=favorites.flatMap(t=>[t.name,t.city,t.short]).map(x=>x.toLowerCase());const matches:LiveGame[]=[];for(const feed of feeds){const pool=feed.games.length?feed.games:feed.next.length?feed.next:feed.previous;for(const game of pool){const text=`${game.home||""} ${game.away||""} ${game.name||""}`.toLowerCase();if(names.some(n=>n.length>2&&text.includes(n)))matches.push(game)}}return matches.slice(0,8)},[feeds,favorites]);
 return <main className="pageShell">
  <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>Scores</span></div>
  <section className="leagueHero"><span className="eyebrow">ALL SPORTS</span><h1>Scores & next up</h1><p>Favorite teams first, then live league boards with real team marks and provider-backed scores.</p></section>
  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">YOUR GAMES</span><h2>Favorites first</h2></div></div>{loading?<div className="empty">Loading current scoreboards…</div>:favoriteGames.length?<div className="richGameGrid">{favoriteGames.map(g=><MatchCard key={`fav-${g.id}`} game={g}/>)}</div>:<div className="gameGrid">{events.slice(0,4).map((g,i)=><Link href={`/game/game-${i+1}`} className="gameCard" key={g.teamId}><CalendarDays/><div><strong>{g.title}</strong><small>{g.detail}</small></div><ChevronRight/></Link>)}</div>}</section>
  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">LEAGUE SCOREBOARDS</span><h2>Across your sports</h2></div></div>{loading?<div className="empty">Loading leagues…</div>:SUPPORTED.map(league=>{const feed=feeds.find(f=>f.league.key===league.id);const pool=feed?(feed.games.length?feed.games:feed.next.length?feed.next:feed.previous):[];return <section className="leagueScoreSection" key={league.id}><div className="leagueScoreHeader"><div><span className="eyebrow">{feed?.source||"LIVE DATA"}</span><h3>{league.name}</h3></div><Link href={`/league/${league.id}`}>League hub <ChevronRight size={15}/></Link></div>{pool.length?<div className="richGameGrid">{pool.slice(0,9).map(game=><MatchCard key={game.id} game={game}/>)}</div>:<div className="empty">No games returned for this league window.</div>}</section>})}</section>
  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">STANDINGS</span><h2>Live tables</h2></div></div><div className="leagueGrid">{SUPPORTED.map(league=>{const feed=feeds.find(f=>f.league.key===league.id);const leader=feed?.standings?.[0];return <Link href={`/league/${league.id}`} className="leagueCard" key={league.id}>{leader?.badge?<img src={leader.badge} alt="" className="leagueLeaderLogo"/>:<Trophy/>}<div><strong>{league.name}</strong><small>{leader?.team?`1. ${leader.team}`:feed?.standingsAvailable?"Standings loading":"Standings unavailable"}</small></div><ChevronRight/></Link>})}</div></section>
 </main>
}

function MatchCard({game}:{game:LiveGame}){return <article className="matchCard"><div className="matchMeta"><span className={isScored(game)?"gameStatus live":"gameStatus"}>{game.status|| (isScored(game)?"SCORE":"UPCOMING")}</span><small>{formatGame(game)}</small></div><div className="matchTeams"><TeamRow name={game.away||"Away"} logo={game.awayLogo} score={game.awayScore}/><TeamRow name={game.home||"Home"} logo={game.homeLogo} score={game.homeScore}/></div></article>}
function TeamRow({name,logo,score}:{name:string;logo?:string;score?:string|null}){return <div className="matchTeamRow">{logo?<img src={logo} alt="" className="matchLogo"/>:<div className="matchLogo fallback">{name.slice(0,2).toUpperCase()}</div>}<strong>{name}</strong><b>{score??"—"}</b></div>}
