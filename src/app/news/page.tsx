import Link from "next/link";
import {ArrowLeft,Newspaper} from "lucide-react";
import {demoStories,teamCatalog} from "@/data/demo";

export default function NewsPage(){
  return <main className="pageShell">
    <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>News</span></div>
    <section className="leagueHero"><span className="eyebrow">FOR YOU</span><h1>Sports news, without the paywall clutter.</h1><p>Favorite teams first, followed leagues next, and only major stories from everything else.</p></section>
    <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">FREE TO READ</span><h2>Top stories</h2></div></div><div className="storyList">{demoStories.map(s=>{const team=teamCatalog.find(t=>t.id===s.teamId);return <article className="storyRow" key={s.id}><div className="storyThumb" style={team?{background:`linear-gradient(145deg,${team.primary},#171c23)`}:undefined}><Newspaper/></div><div><small>{s.source} · {s.time}</small><h3>{s.headline}</h3><p>{s.summary}</p>{team&&<Link className="backLink" href={`/team/${team.id}`}>View {team.short} team hub</Link>}</div></article>})}</div></section>
    <section className="contentSection"><div className="empty"><p>When live news ingestion is connected, this screen will deduplicate stories and prefer the highest-ranked free source — ESPN first, then Bleacher Report.</p></div></section>
  </main>
}
