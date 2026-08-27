import LeaguePageClient from "@/components/LeaguePageClient";
export default async function LeaguePage({params}:{params:Promise<{leagueId:string}>}) {
  const {leagueId}=await params;
  return <LeaguePageClient leagueId={leagueId}/>;
}
