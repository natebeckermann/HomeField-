"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Search, Trophy, UserRound, Newspaper } from "lucide-react";
import { teamCatalog, demoGames, demoStories, defaultLeaguePrefs } from "@/data/demo";

const demoPlayers = [
  {id:"p1",name:"Demo Player A",teamId:"stl-cardinals",position:"OF"},
  {id:"p2",name:"Demo Player B",teamId:"stl-blues",position:"C"},
  {id:"p3",name:"Demo Player C",teamId:"indiana-football",position:"QB"},
  {id:"p4",name:"Demo Player D",teamId:"man-utd",position:"MF"},
  {id:"p5",name:"Demo Player E",teamId:"stl-city",position:"FW"}
];

function norm(s:string){return s.toLowerCase().trim();}

export default function SearchPageClient(){
  const [q,setQ]=useState("");
  const query=norm(q);
  const teamResults=useMemo(()=>!query?[]:teamCatalog.filter(t => [t.name,t.city,t.short,t.league,t.sport].some(x=>norm(x).includes(query))).slice(0,8),[query]);
  const leagueResults=useMemo(()=>!query?[]:defaultLeaguePrefs.filter(l => norm(l.name).includes(query)).slice(0,8),[query]);
  const playerResults=useMemo(()=>!query?[]:demoPlayers.filter(p => { const t=teamCatalog.find(x=>x.id===p.teamId); return [p.name,p.position,t?.name||""].some(x=>norm(x).includes(query)) }).slice(0,8),[query]);
  const storyResults=useMemo(()=>!query?[]:demoStories.filter(s => [s.headline,s.summary,s.source].some(x=>norm(x).includes(query))).slice(0,10),[query]);
  const gameResults=useMemo(()=>!query?[]:demoGames.filter(g => { const t=teamCatalog.find(x=>x.id===g.teamId); return [g.opponent,g.detail,t?.name||"",t?.league||""].some(x=>norm(x).includes(query)) }).slice(0,10),[query]);
  const total=teamResults.length+leagueResults.length+playerResults.length+storyResults.length+gameResults.length;
  return <main className="searchPageShell">
    <div className="searchTopbar"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>Universal Search</span></div>
    <section className="searchHero"><span className="eyebrow">SEARCH HOMEFIELD</span><h1>Everything you follow, one search.</h1><p>Search teams, leagues, players, games and stories without leaving HomeField.</p><div className="searchInputLarge"><Search size={21}/><input aria-label="Search HomeField" autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Cardinals, Premier League, player, story…"/></div></section>
    {!query && <section className="searchEmpty"><Search size={28}/><h2>Start typing</h2><p>Try a team, league, sport, player, opponent or headline.</p></section>}
    {query && total===0 && <section className="searchEmpty"><Search size={28}/><h2>No results</h2><p>Nothing matched “{q}”.</p></section>}
    {teamResults.length>0 && <ResultSection title="Teams" icon={<Trophy size={18}/>}><div className="searchGrid">{teamResults.map(t=><Link href={`/team/${t.id}`} className="searchCard" key={t.id}><div className="miniMark" style={{background:`linear-gradient(145deg,${t.primary},${t.secondary})`}}>{t.short}</div><div><strong>{t.name}</strong><small>{t.league} · {t.sport}</small></div></Link>)}</div></ResultSection>}
    {leagueResults.length>0 && <ResultSection title="Leagues & Competitions" icon={<Trophy size={18}/>}><div className="searchGrid">{leagueResults.map(l=><Link href={`/league/${l.id}`} className="searchCard" key={l.id}><div className="genericSearchIcon"><Trophy size={18}/></div><div><strong>{l.name}</strong><small>{l.coverage==="full"?"Full coverage":l.coverage==="major"?"Major stories":"Available"}</small></div></Link>)}</div></ResultSection>}
    {playerResults.length>0 && <ResultSection title="Players" icon={<UserRound size={18}/>}><div className="searchGrid">{playerResults.map(p=>{const t=teamCatalog.find(x=>x.id===p.teamId);return <div className="searchCard" key={p.id}><div className="genericSearchIcon"><UserRound size={18}/></div><div><strong>{p.name}</strong><small>{p.position} · {t?.name}</small></div></div>})}</div></ResultSection>}
    {gameResults.length>0 && <ResultSection title="Games" icon={<CalendarDays size={18}/>}><div className="searchList">{gameResults.map(g=>{const t=teamCatalog.find(x=>x.id===g.teamId);return <Link href={`/game/${g.id}`} className="searchListRow" key={g.id}><CalendarDays size={18}/><div><strong>{t?.name} {g.opponent}</strong><small>{g.detail}</small></div></Link>})}</div></ResultSection>}
    {storyResults.length>0 && <ResultSection title="Stories" icon={<Newspaper size={18}/>}><div className="searchList">{storyResults.map(s=><div className="searchListRow storyResult" key={s.id}><Newspaper size={18}/><div><strong>{s.headline}</strong><small>{s.source} · {s.time}</small><p>{s.summary}</p></div></div>)}</div></ResultSection>}
  </main>
}
function ResultSection({title,icon,children}:{title:string,icon:React.ReactNode,children:React.ReactNode}){return <section className="searchResultsSection"><div className="sectionHead"><div><span className="eyebrow">RESULTS</span><h2>{icon}{title}</h2></div></div>{children}</section>}
