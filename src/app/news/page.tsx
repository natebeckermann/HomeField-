"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Newspaper,ExternalLink} from "lucide-react";
import {defaultFavoriteTeamIds,demoStories,teamCatalog} from "@/data/demo";

const KEY="homefield-preferences-v1";
type Story={id:string;headline:string;summary:string;source:string;league:string;url:string;image?:string|null;published?:string|null;favoriteTeamIds?:string[];personalized?:boolean};
function age(value?:string|null){if(!value)return "Latest";const ms=Date.now()-new Date(value).getTime();if(!Number.isFinite(ms))return "Latest";const h=Math.max(0,Math.floor(ms/3600000));if(h<1)return "Just now";if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`}

export default function NewsPage(){
  const [stories,setStories]=useState<Story[]>([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;async function load(){let favorites=defaultFavoriteTeamIds;try{const saved=JSON.parse(localStorage.getItem(KEY)||"{}");if(Array.isArray(saved.favoriteTeamIds))favorites=saved.favoriteTeamIds}catch{}try{const res=await fetch(`/api/news?teams=${encodeURIComponent(favorites.join(","))}`);if(!res.ok)throw new Error("feed unavailable");const data=await res.json();if(!cancelled)setStories(data?.stories||[])}catch{if(!cancelled)setStories([])}finally{if(!cancelled)setLoading(false)}}load();return()=>{cancelled=true}},[]);
  return <main className="pageShell">
    <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>News</span></div>
    <section className="leagueHero"><span className="eyebrow">FOR YOU</span><h1>Sports news, without the paywall clutter.</h1><p>Favorite teams first, followed leagues next, and only major stories from everything else.</p></section>
    <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">FREE TO READ</span><h2>Top stories</h2></div></div>{loading?<div className="empty">Loading live headlines…</div>:stories.length?<div className="storyList">{stories.map(s=>{const team=teamCatalog.find(t=>s.favoriteTeamIds?.includes(t.id));return <a href={s.url} target="_blank" rel="noreferrer" className="storyRow liveStoryRow" key={s.id}><div className="storyThumb liveStoryThumb" style={s.image?{backgroundImage:`url(${s.image})`}:team?{background:`linear-gradient(145deg,${team.primary},#171c23)`}:undefined}>{!s.image&&<Newspaper/>}</div><div><small>{s.source} · {s.league} · {age(s.published)}{s.personalized?" · FOR YOU":""}</small><h3>{s.headline}</h3>{s.summary&&<p>{s.summary}</p>}<span className="storyOpen">Read free article <ExternalLink size={13}/></span></div></a>})}</div>:<div className="storyList">{demoStories.map(s=>{const team=teamCatalog.find(t=>t.id===s.teamId);return <article className="storyRow" key={s.id}><div className="storyThumb" style={team?{background:`linear-gradient(145deg,${team.primary},#171c23)`}:undefined}><Newspaper/></div><div><small>{s.source} · {s.time}</small><h3>{s.headline}</h3><p>{s.summary}</p></div></article>})}</div>}</section>
    <section className="contentSection"><div className="empty"><p>ESPN is live now. HomeField filters obvious ESPN+ / Insider items and ranks stories matching your favorite teams first. Bleacher Report is the next source layer.</p></div></section>
  </main>
}
