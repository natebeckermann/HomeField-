import Link from "next/link";
import {ArrowLeft,CalendarDays,ChevronRight,Trophy} from "lucide-react";
import {demoGames,teamCatalog} from "@/data/demo";

export default function ScoresPage(){
  return <main className="pageShell">
    <div className="pageTop"><Link href="/" className="backLink"><ArrowLeft size={17}/>HomeField</Link><span>Scores</span></div>
    <section className="leagueHero"><span className="eyebrow">ALL SPORTS</span><h1>Scores & next up</h1><p>Your followed teams and competitions in one place.</p></section>
    <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">YOUR GAMES</span><h2>Live, recent & upcoming</h2></div></div><div className="gameGrid">{demoGames.map(g=>{const team=teamCatalog.find(t=>t.id===g.teamId);return <Link href={`/game/${g.id}`} className="gameCard" key={g.id}><CalendarDays/><div><strong>{team?.name} {g.opponent}</strong><small>{g.detail}</small></div><ChevronRight/></Link>})}</div></section>
    <section className="contentSection"><div className="sectionHead"><div><span className="eyebrow">COMING NEXT</span><h2>League scoreboards</h2></div></div><div className="empty"><Trophy/><p>Live league scoreboards will populate here when the sports data feed is connected.</p></div></section>
  </main>
}
