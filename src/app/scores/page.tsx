"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,CalendarDays,ChevronRight,Radio,Trophy} from "lucide-react";
import {defaultFavoriteTeamIds,events,teamCatalog} from "@/data/demo";

const KEY="homefield-preferences-v1";
const SUPPORTED=[
 {id:"mlb",name:"MLB"},{id:"nhl",name:"NHL"},{id:"nfl",name:"NFL"},{id:"nba",name:"NBA"},{id:"mls",name:"MLS"},{id:"epl",name:"Premier League"}
];

type LiveGame={id:string;name?:string;home?:string;away?:string;homeScore?:string|null;awayScore?:string|null;date?:string;time?:string;venue?:string;status?:string};
type LeagueFeed={league:{key:string;name:string};games:LiveGame[];next:LiveGame[];previous:LiveGame[];standingsAvailable:boolean;standings:any[]};

function formatGame(game:LiveGame){const date=game.date?new Date(`${game.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Date TBD";const time=game.time?game.time.slice(0,5):"Time TBD";return [date,time,game.venue,game.status].filter(Boolean).join(" · ")}
function gameLabel(game:LiveGame){return game.home&&game.away?`${game.away} at ${game.home}`:game.name||"League event"}

export default function ScoresPage(){
 const [favoriteIds,setFavoriteIds]=useState(defaultFavoriteTeamIds);
 const [feeds,setFeeds]=useState<LeagueFeed[]>([]);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setFavoriteIds(JSON.parse(raw).favoriteTeamIds||defaultFavoriteTeamIds)}catch{}},[]);
 const favorites=useMemo(()=>favoriteIds.map(id=>teamCatalog.find(t=>t.id===id)).filter(Boolean) as typeof teamCatalog,[favoriteIds]);

 useEffect(()=>{
  let cancelled=false;
  async function load(){
   setLoading(true);
   const rows=await Promise.all(SUPPORTED.map(async league=>{
    try{const res=await fetch(`/api/sports/league?league=${league.id}`);if(!res.ok)return null;return await res.json() as LeagueFeed}catch{return null}
   }));
   if(!cancelled){setFeeds(rows.filter(Boolean) as LeagueFeed[]);setLoading(false)}
  }
  load();return()=>{cancelled=true};
 },[]);

 const favoriteGames=useMemo(()=>{
  const names=favorites.flatMap(t=>[t.name,t.city,t.short]).map(x=>x.toLowerCase());
  const matches:LiveGame[]=[];
  for(const feed of feeds){const pool=feed.games.length?feed.games:feed.next.length?feed.next:feed.previous;for(const game of pool){const text=`${game.home||""} ${game.away||""} ${game.name||""}`.toLowerCase();if(names.some(n=>n.length>2&&text.includes(n)))matches.push(game)}}
  return matches.slice(0,8);
 },[feeds,favorites]);

 return <main className="pageShell">
  <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>Scores</span></div>
  <section className="leagueHero"><span className="eyebrow">ALL SPORTS</span><h1>Scores & next up</h1><p>Favorite teams first, followed by live league-wide scoreboards from the current free data feed.</p></section>

  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">YOUR GAMES</span><h2>Favorites first</h2></div></div>{loading?<div className="empty">Loading current scoreboards…</div>:favoriteGames.length?<div className="gameGrid">{favoriteGames.map(g=><div className="gameCard" key={`fav-${g.id}`}><Radio/><div><strong>{gameLabel(g)}</strong><small>{formatGame(g)}</small>{g.homeScore!=null&&g.awayScore!=null&&<small>{g.awayScore} - {g.homeScore}</small>}</div></div>)}</div>:<div className="gameGrid">{events.slice(0,4).map((g,i)=><Link href={`/game/game-${i+1}`} className="gameCard" key={g.teamId}><CalendarDays/><div><strong>{g.title}</strong><small>{g.detail}</small><small>Fallback until provider returns this matchup</small></div><ChevronRight/></Link>)}</div>}</section>

  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">LEAGUE SCOREBOARDS</span><h2>Across your sports</h2></div></div>{loading?<div className="empty">Loading leagues…</div>:<div className="storyList">{SUPPORTED.map(league=>{const feed=feeds.find(f=>f.league.key===league.id);const pool=feed?(feed.games.length?feed.games:feed.next.length?feed.next:feed.previous):[];return <div className="storyRow" key={league.id}><div className="storyThumb"><Trophy/></div><div style={{width:"100%"}}><small>LIVE DATA · THESPORTSDB</small><h3><Link href={`/league/${league.id}`}>{league.name}</Link></h3>{pool.length?<div className="searchList">{pool.map(game=><div className="searchListRow" key={game.id}><Radio size={18}/><div><strong>{gameLabel(game)}</strong><small>{formatGame(game)}</small>{game.homeScore!=null&&game.awayScore!=null&&<p>{game.awayScore} - {game.homeScore}</p>}</div></div>)}</div>:<p>No games were returned for the current league window.</p>}</div></div>})}</div>}</section>

  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">STANDINGS</span><h2>Live tables</h2></div></div><div className="leagueGrid">{SUPPORTED.map(league=>{const feed=feeds.find(f=>f.league.key===league.id);return <Link href={`/league/${league.id}`} className="leagueCard" key={league.id}><Trophy/><div><strong>{league.name}</strong><small>{feed?.standings?.length?`${feed.standings.length} live table rows`:feed?.standingsAvailable?"Table supported · awaiting data":"Free standings unavailable"}</small></div><ChevronRight/></Link>})}</div></section>
 </main>
}
