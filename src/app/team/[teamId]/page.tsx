import TeamPageClient from "@/components/TeamPageClient";
export default async function TeamPage({params}:{params:Promise<{teamId:string}>}) {
  const {teamId}=await params;
  return <TeamPageClient teamId={teamId}/>;
}
