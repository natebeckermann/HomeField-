"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,CalendarDays,ChevronRight,Radio,Trophy} from "lucide-react";
import {defaultFavoriteTeamIds,events,teamCatalog} from "@/data/demo";

const KEY="homefield-preferences-v1";
const API_NAMES:Record<string,string>={
 "stl-cardinals":"St. Louis Cardinals",
 "stl-blues":"St. Louis Blues",
 "indiana-football":"Indiana Hoosiers",
 "indiana-basketball":"Indiana Hoosiers",
 "slu-basketball":"Saint Louis Billikens",
 "stl-city":"St. Louis City SC",
 "man-utd":"Manchester United"
};

type ScoreCard={teamId:string;title:string;detail:string;status?:string;eventId?:string;isLiveData:boolean};

function formatEventDetail(event:any){
 const date=event?.date?new Date(`${event.date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}):"Date TBD";
 const time=event?.time?event.time.slice(0,5):"Time TBD";
 return [date,time,event?.venue].filter(Boolean).join(" · ");
}

export default function ScoresPage(){
 const [favoriteIds,setFavoriteIds]=useState(defaultFavoriteTeamIds);
 const [cards,setCards]=useState<ScoreCard[]>([]);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw)setFavoriteIds(JSON.parse(raw).favoriteTeamIds||defaultFavoriteTeamIds)}catch{}},[]);
 const teams=useMemo(()=>favoriteIds.map(id=>teamCatalog.find(t=>t.id===id)).filter(Boolean) as typeof teamCatalog,[favoriteIds]);

 useEffect(()=>{
  let cancelled=false;
  async function load(){
   setLoading(true);
   const rows=await Promise.all(teams.map(async team=>{
    try{
     const res=await fetch(`/api/sports/team?name=${encodeURIComponent(API_NAMES[team.id]||team.name)}`);
     if(!res.ok)throw new Error("sports feed unavailable");
     const data=await res.json();
     if(data?.nextEvent){return {teamId:team.id,title:data.nextEvent.name||team.name,detail:formatEventDetail(data.nextEvent),status:data.nextEvent.status||"NEXT",eventId:data.nextEvent.id,isLiveData:true} satisfies ScoreCard}
    }catch{}
    const fallback=events.find(e=>e.teamId===team.id);
    return fallback?{teamId:team.id,title:fallback.title,detail:fallback.detail,status:fallback.status,isLiveData:false} satisfies ScoreCard:null;
   }));
   if(!cancelled){setCards(rows.filter(Boolean) as ScoreCard[]);setLoading(false)}
  }
  if(teams.length)load();else{setCards([]);setLoading(false)}
  return()=>{cancelled=true};
 },[teams]);

 return <main className="pageShell">
  <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>Scores</span></div>
  <section className="leagueHero"><span className="eyebrow">ALL SPORTS</span><h1>Scores & next up</h1><p>Your favorite teams in one place, with real schedule data whenever the free feed has it.</p></section>
  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">YOUR GAMES</span><h2>Live, recent & upcoming</h2></div></div>{loading?<div className="empty">Loading current schedules…</div>:cards.length?<div className="gameGrid">{cards.map((g,i)=><Link href={g.isLiveData?`/team/${g.teamId}`:`/game/game-${Math.max(1,events.findIndex(e=>e.teamId===g.teamId)+1)}`} className="gameCard" key={`${g.teamId}-${g.eventId||i}`}>{g.isLiveData?<Radio/>:<CalendarDays/>}<div><strong>{g.title}</strong><small>{g.detail}</small>{g.isLiveData&&<small>Live data · TheSportsDB</small>}</div><ChevronRight/></Link>)}</div>:<div className="empty">No favorite-team games are available yet.</div>}</section>
  <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">DATA STATUS</span><h2>Live feed foundation</h2></div></div><div className="empty"><Trophy/><p>HomeField now checks the sports provider for each favorite team and falls back gracefully when a league or matchup is missing. League-wide scoreboards are the next expansion.</p></div></section>
 </main>
}
